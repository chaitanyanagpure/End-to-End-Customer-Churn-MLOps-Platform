from sqlalchemy.orm import Session
from app.models.model import ModelMetadata
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class ModelMetadataRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, model_id: UUID) -> Optional[ModelMetadata]:
        return self.db.query(ModelMetadata).filter(ModelMetadata.id == model_id).first()

    def get_by_version(self, version: str) -> Optional[ModelMetadata]:
        return self.db.query(ModelMetadata).filter(ModelMetadata.version == version).first()

    def get_active_model(self) -> Optional[ModelMetadata]:
        return self.db.query(ModelMetadata).filter(ModelMetadata.status == "Production").first()

    def create(self, model_meta: ModelMetadata) -> ModelMetadata:
        self.db.add(model_meta)
        self.db.commit()
        self.db.refresh(model_meta)
        return model_meta

    def list_all(self) -> List[ModelMetadata]:
        return self.db.query(ModelMetadata).order_by(ModelMetadata.registered_at.desc()).all()

    def promote_to_production(self, version: str) -> Optional[ModelMetadata]:
        # Demote current production models
        current_prod = self.db.query(ModelMetadata).filter(ModelMetadata.status == "Production").all()
        for prod_model in current_prod:
            prod_model.status = "Staging"
            
        # Promote target model
        target_model = self.get_by_version(version)
        if target_model:
            target_model.status = "Production"
            target_model.deployed_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(target_model)
        else:
            self.db.rollback()
        return target_model
