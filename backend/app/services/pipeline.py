from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
import pandas as pd
import io
import traceback
from datetime import datetime

from app.repositories.retraining_job import RetrainingJobRepository
from app.repositories.dataset import DatasetRepository
from app.repositories.model import ModelMetadataRepository
from app.models.retraining_job import RetrainingJob
from app.models.model import ModelMetadata
from app.ml.train import trainer
from app.core.s3 import s3_client
from app.core.exceptions import ValidationError
from app.core.logging import logger
from app.services.audit import AuditService
from uuid import UUID
from typing import Optional

class PipelineService:
    def __init__(self, db: Session):
        self.db = db
        self.job_repo = RetrainingJobRepository(db)
        self.dataset_repo = DatasetRepository(db)
        self.model_repo = ModelMetadataRepository(db)
        self.audit_service = AuditService(db)

    def trigger_retraining(
        self, version: str, dataset_id: Optional[UUID], background_tasks: BackgroundTasks, trigger_type: str = "Manual"
    ) -> RetrainingJob:
        # Validate that version doesn't exist
        existing_model = self.model_repo.get_by_version(version)
        if existing_model:
            raise ValidationError(detail=f"Model version '{version}' already exists in registry.")

        # Find target dataset
        if dataset_id:
            dataset = self.dataset_repo.get_by_id(dataset_id)
        else:
            datasets = self.dataset_repo.list_all()
            dataset = datasets[0] if len(datasets) > 0 else None

        if not dataset:
            raise ValidationError(detail="No dataset available for training. Please upload one first.")

        # Create RetrainingJob record
        job = RetrainingJob(
            status="Running",
            trigger_type=trigger_type
        )
        created_job = self.job_repo.create(job)
        self.audit_service.log_action(
            None, 
            "TRAINING_TRIGGERED", 
            f"Model retraining triggered for version {version} using dataset {dataset.name}."
        )

        # Enqueue background training task
        background_tasks.add_task(
            self._execute_training_task, 
            created_job.id, 
            version, 
            dataset.s3_key
        )

        return created_job

    def _execute_training_task(self, job_id: UUID, version: str, dataset_s3_key: str):
        # We need to create a fresh DB session inside background threads to prevent cross-thread session issues
        from app.core.database import SessionLocal
        db = SessionLocal()
        job_repo = RetrainingJobRepository(db)
        model_repo = ModelMetadataRepository(db)
        audit_service = AuditService(db)

        try:
            logger.info(f"Background training started for Job {job_id}, version {version}")
            
            # 1. Download dataset from S3
            csv_bytes = s3_client.download_file(dataset_s3_key)
            df = pd.read_csv(io.BytesIO(csv_bytes))
            
            # Check if dataset contains target column
            if "churn" not in df.columns:
                raise ValueError("Target label column 'churn' not found in dataset. Retraining requires labeled features.")

            # 2. Run trainer
            results = trainer.run_training_pipeline(df, version)
            
            # 3. Create ModelMetadata in DB
            new_model = ModelMetadata(
                model_name="customer_churn_model",
                version=version,
                run_id=results["run_id"],
                status="Staging", # New models start in Staging
                metrics_json=results["metrics"],
                hyperparams_json=results["hyperparameters"]
            )
            model_repo.create(new_model)

            # 4. Mark Job as Success
            job_repo.update_job(job_id, "Success", created_model_version=version)
            audit_service.log_action(
                None,
                "TRAINING_SUCCESS",
                f"Model training succeeded for version {version}. Registered in registry."
            )
            
            # Also log metrics as part of job log
            logger.info(f"Model retraining successfully finished for version {version}.")
        
        except Exception as e:
            error_trace = traceback.format_exc()
            logger.error(f"Error during model retraining: {str(e)}\n{error_trace}")
            job_repo.update_job(job_id, "Failed", error_message=str(e))
            audit_service.log_action(
                None,
                "TRAINING_FAILED",
                f"Model training failed for version {version}. Error: {str(e)}"
            )
        finally:
            db.close()
