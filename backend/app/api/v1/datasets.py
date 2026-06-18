from fastapi import APIRouter, Depends, UploadFile, File, Form, status, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.schemas.dataset import DatasetOut, DriftReportOut
from app.services.dataset import DatasetService
from app.services.audit import AuditService
from app.repositories.dataset import DatasetRepository
from app.core.s3 import s3_client
from app.models.user import User
from typing import List
from uuid import UUID

router = APIRouter()

@router.post("/upload", response_model=DatasetOut, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    version: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset_service = DatasetService(db)
    audit_service = AuditService(db)
    
    # Read file contents
    contents = await file.read()
    
    # Process and save dataset
    dataset = dataset_service.process_and_upload(
        file_content=contents,
        filename=file.filename,
        version=version,
        user_id=current_user.id
    )
    
    # Log audit event
    audit_service.log_action(
        current_user.id,
        "DATASET_UPLOAD",
        f"Uploaded dataset '{file.filename}' as version '{version}' ({dataset.row_count} rows)."
    )
    
    return dataset

@router.get("", response_model=List[DatasetOut])
def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset_repo = DatasetRepository(db)
    return dataset_repo.list_all()

@router.get("/{dataset_id}", response_model=DatasetOut)
def get_dataset(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset_repo = DatasetRepository(db)
    dataset = dataset_repo.get_by_id(dataset_id)
    if not dataset:
        from app.core.exceptions import NotFoundException
        raise NotFoundException(detail="Dataset not found")
    return dataset

@router.get("/{dataset_id}/drift", response_model=DriftReportOut)
def get_dataset_drift(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset_service = DatasetService(db)
    return dataset_service.get_drift_metrics(dataset_id)

@router.get("/{dataset_id}/report", response_class=HTMLResponse)
def get_drift_html_report(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset_repo = DatasetRepository(db)
    dataset = dataset_repo.get_by_id(dataset_id)
    if not dataset or not dataset.drift_report_s3_key:
        from app.core.exceptions import ValidationError
        raise ValidationError(detail="Drift report not available for this dataset.")
        
    try:
        report_html = s3_client.download_file(dataset.drift_report_s3_key)
        return HTMLResponse(content=report_html.decode("utf-8"))
    except Exception as e:
        from app.core.exceptions import PredictWiseException
        raise PredictWiseException(status_code=500, detail=f"Failed to load drift report: {str(e)}")
