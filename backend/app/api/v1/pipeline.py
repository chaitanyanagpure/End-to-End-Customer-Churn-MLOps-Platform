from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user, check_admin
from app.schemas.model import RetrainingJobOut, TriggerRetrainIn
from app.services.pipeline import PipelineService
from app.repositories.retraining_job import RetrainingJobRepository
from app.models.user import User
from typing import List

router = APIRouter()

@router.post("/train", response_model=RetrainingJobOut, status_code=status.HTTP_202_ACCEPTED)
def trigger_training(
    payload: TriggerRetrainIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin_user: User = Depends(check_admin)
):
    pipeline_service = PipelineService(db)
    job = pipeline_service.trigger_retraining(
        version=payload.version,
        dataset_id=payload.dataset_id,
        background_tasks=background_tasks,
        trigger_type="Manual"
    )
    return job

@router.get("/runs", response_model=List[RetrainingJobOut])
def list_pipeline_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job_repo = RetrainingJobRepository(db)
    return job_repo.list_all()
