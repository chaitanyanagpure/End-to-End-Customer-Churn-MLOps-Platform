from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
import pandas as pd
import io

from app.core.database import SessionLocal
from app.repositories.dataset import DatasetRepository
from app.repositories.model import ModelMetadataRepository
from app.services.pipeline import PipelineService
from app.ml.drift import drift_detector
from app.core.s3 import s3_client
from app.core.logging import logger

class RetrainingScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()

    def start(self):
        if not self.scheduler.running:
            # Run data drift & retraining check every hour
            self.scheduler.add_job(
                self.check_and_retrain_if_drifted, 
                'interval', 
                hours=1, 
                id='drift_retrain_check'
            )
            self.scheduler.start()
            logger.info("Background Retraining Scheduler successfully started.")

    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Background Retraining Scheduler successfully shut down.")

    def check_and_retrain_if_drifted(self):
        logger.info("Running scheduled data drift check...")
        db = SessionLocal()
        dataset_repo = DatasetRepository(db)
        model_repo = ModelMetadataRepository(db)
        pipeline_service = PipelineService(db)

        try:
            datasets = dataset_repo.list_all()
            if len(datasets) < 2:
                logger.info("Insufficient datasets in catalog (< 2) to compute comparative drift. Skipping retraining.")
                return

            # Reference is the oldest dataset (baseline), current is the latest uploaded
            latest_dataset = datasets[0]
            baseline_dataset = datasets[-1]
            
            logger.info(f"Comparing latest dataset '{latest_dataset.version}' against baseline '{baseline_dataset.version}'...")
            
            # Download dataframes
            latest_bytes = s3_client.download_file(latest_dataset.s3_key)
            baseline_bytes = s3_client.download_file(baseline_dataset.s3_key)
            
            latest_df = pd.read_csv(io.BytesIO(latest_bytes))
            baseline_df = pd.read_csv(io.BytesIO(baseline_bytes))

            # Run drift check
            drift_results = drift_detector.calculate_drift(baseline_df, latest_df)
            
            if drift_results["drift_detected"]:
                logger.warning(f"Concept drift detected! Drift ratio is {drift_results['drift_ratio']:.1%}. Enqueuing retraining...")
                
                # Check if we already have a model version matching this trigger to avoid infinite retraining loops
                target_version = f"auto_{latest_dataset.version}"
                existing_model = model_repo.get_by_version(target_version)
                
                if not existing_model:
                    from fastapi import BackgroundTasks
                    bg_tasks = BackgroundTasks()
                    
                    # Trigger retraining
                    pipeline_service.trigger_retraining(
                        version=target_version,
                        dataset_id=latest_dataset.id,
                        background_tasks=bg_tasks,
                        trigger_type="Scheduled"
                    )
                    logger.info(f"Automated scheduled retraining triggered for version {target_version}.")
                    # Execute task immediately (since it runs in background thread in FastAPI, we run it manually here)
                    # For safety, we can run it in a thread directly in production or let BackgroundTasks handle it
                    # In a simple scheduler, running the task synchronously inside scheduler thread is safe since it's already a background thread.
                    # We can fetch the latest job created and run it
                    jobs = pipeline_service.job_repo.list_all(limit=1)
                    if jobs:
                        # run training synchronously in this scheduler background thread
                        pipeline_service._execute_training_task(jobs[0].id, target_version, latest_dataset.s3_key)
                else:
                    logger.info(f"Model version '{target_version}' already exists in registry. Skipping retraining.")
            else:
                logger.info("Dataset drift within acceptable bounds. Retraining is not required.")

        except Exception as e:
            logger.error(f"Error during scheduled retraining check: {str(e)}")
        finally:
            db.close()

retraining_scheduler = RetrainingScheduler()
