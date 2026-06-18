from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user, check_admin
from app.schemas.model import ModelMetadataOut
from app.repositories.model import ModelMetadataRepository
from app.models.user import User
from app.services.audit import AuditService
from typing import List

router = APIRouter()

@router.get("/models", response_model=List[ModelMetadataOut])
def list_registered_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    model_repo = ModelMetadataRepository(db)
    return model_repo.list_all()

@router.put("/models/{version}/stage", response_model=ModelMetadataOut)
def update_model_stage(
    version: str,
    stage: str = Query(..., pattern="^(Production|Staging|Archived)$"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(check_admin)
):
    model_repo = ModelMetadataRepository(db)
    audit_service = AuditService(db)
    
    if stage == "Production":
        updated_model = model_repo.promote_to_production(version)
    else:
        # Simple stage transition for staging/archive
        target_model = model_repo.get_by_version(version)
        if target_model:
            target_model.status = stage
            db.commit()
            db.refresh(target_model)
            updated_model = target_model
        else:
            updated_model = None
            
    if not updated_model:
        from app.core.exceptions import NotFoundException
        raise NotFoundException(detail=f"Model version '{version}' not found.")
        
    audit_service.log_action(
        admin_user.id,
        "MODEL_PROMOTION",
        f"Promoted model version '{version}' to stage '{stage}'."
    )
    
    return updated_model
