from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app, Counter, Histogram
import time

from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.db_init import init_db
from app.services.scheduler import retraining_scheduler
from app.api.v1 import auth, datasets, predict, pipeline, registry, monitoring, reports, logs, experiments

# Initialize logger
setup_logging()

# Initialize FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise-Grade Customer Churn Prediction MLOps Platform API Gateway",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup CORS for development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Prometheus Telemetry Setup
# -------------------------------------------------------------
# Expose /metrics endpoint for Prometheus scraping
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

HTTP_REQUEST_COUNT = Counter(
    "http_requests_total", 
    "Total HTTP requests received", 
    ["method", "endpoint", "status_code"]
)

HTTP_REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", 
    "HTTP request latency in seconds", 
    ["method", "endpoint"]
)

@app.middleware("http")
async def prometheus_telemetry_middleware(request: Request, call_next):
    # Skip tracking metrics for the /metrics path itself to avoid infinite counts
    if request.url.path == "/metrics":
        return await call_next(request)

    start_time = time.time()
    response = await call_next(request)
    latency = time.time() - start_time
    
    # Record metrics
    status_code = str(response.status_code)
    method = request.method
    endpoint = request.url.path
    
    HTTP_REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
    HTTP_REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(latency)
    
    return response

# -------------------------------------------------------------
# Startup / Shutdown Hooks
# -------------------------------------------------------------
@app.on_event("startup")
def startup_event():
    logger.info("Starting up PredictWise AI Backend Server...")
    
    # Initialize DB tables and seed Admin
    init_db()
    
    # Ensure S3 Bucket exists
    from app.core.s3 import s3_client
    s3_client.ensure_bucket_exists()
    
    # Pre seed baseline dataset & model if database is empty
    # This ensures a fully functional sandbox out-of-the-box
    preseed_sandbox_components()

    # Start the continuous retraining scheduler
    retraining_scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    logger.info("Shutting down PredictWise AI Backend Server...")
    retraining_scheduler.shutdown()

def preseed_sandbox_components():
    from app.core.database import SessionLocal
    from app.repositories.dataset import DatasetRepository
    from app.repositories.model import ModelMetadataRepository
    from app.services.dataset import DatasetService
    from app.services.pipeline import PipelineService
    from app.ml.synthetic_data import generate_synthetic_churn_data
    from fastapi import BackgroundTasks

    db = SessionLocal()
    dataset_repo = DatasetRepository(db)
    model_repo = ModelMetadataRepository(db)
    
    try:
        datasets = dataset_repo.list_all()
        if len(datasets) == 0:
            logger.info("Initializing Sandbox with synthetic Customer Churn data...")
            # 1. Generate synthetic data
            df = generate_synthetic_churn_data(1500)
            csv_buffer = io.BytesIO()
            df.to_csv(csv_buffer, index=False)
            csv_bytes = csv_buffer.getvalue()

            # 2. Upload dataset as version 1.0 (Baseline)
            dataset_service = DatasetService(db)
            # Find Admin user to assign upload
            from app.models.user import User
            admin = db.query(User).filter(User.role == "Admin").first()
            admin_id = admin.id if admin else None
            
            baseline_dataset = dataset_service.process_and_upload(
                file_content=csv_bytes,
                filename="churn_baseline_v1.csv",
                version="v1.0",
                user_id=admin_id
            )
            logger.info("Baseline training dataset seeded on S3.")

            # 3. Trigger initial model training immediately
            models = model_repo.list_all()
            if len(models) == 0:
                logger.info("Triggering initial model training run for version v1.0...")
                pipeline_service = PipelineService(db)
                bg_tasks = BackgroundTasks()
                
                # We execute retraining synchronously during seed startup to make the platform fully ready
                job = pipeline_service.trigger_retraining(
                    version="v1.0",
                    dataset_id=baseline_dataset.id,
                    background_tasks=bg_tasks,
                    trigger_type="Manual"
                )
                pipeline_service._execute_training_task(job.id, "v1.0", baseline_dataset.s3_key)
                
                # Promote to Production automatically
                model_repo.promote_to_production("v1.0")
                logger.info("Initial model v1.0 successfully trained and set as Active Production model.")
    except Exception as e:
        logger.error(f"Failed to pre seed sandbox environment: {str(e)}")
    finally:
        db.close()

# Helper for pre-seed import
import io

# -------------------------------------------------------------
# Register Routers
# -------------------------------------------------------------
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(datasets.router, prefix=f"{settings.API_V1_STR}/datasets", tags=["Datasets"])
app.include_router(predict.router, prefix=f"{settings.API_V1_STR}/predict", tags=["Predictions"])
app.include_router(pipeline.router, prefix=f"{settings.API_V1_STR}/pipeline", tags=["ML Pipeline"])
app.include_router(registry.router, prefix=f"{settings.API_V1_STR}/registry", tags=["Model Registry"])
app.include_router(monitoring.router, prefix=f"{settings.API_V1_STR}/monitoring", tags=["Monitoring"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])
app.include_router(logs.router, prefix=f"{settings.API_V1_STR}/logs", tags=["Activity Logs"])
app.include_router(experiments.router, prefix=f"{settings.API_V1_STR}/experiments", tags=["Experiments"])
