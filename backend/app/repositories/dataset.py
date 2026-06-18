from sqlalchemy.orm import Session
from app.models.dataset import Dataset
from typing import List, Optional
from uuid import UUID

class DatasetRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, dataset_id: UUID) -> Optional[Dataset]:
        return self.db.query(Dataset).filter(Dataset.id == dataset_id).first()

    def get_by_version(self, version: str) -> Optional[Dataset]:
        return self.db.query(Dataset).filter(Dataset.version == version).first()

    def create(self, dataset: Dataset) -> Dataset:
        self.db.add(dataset)
        self.db.commit()
        self.db.refresh(dataset)
        return dataset

    def list_all(self) -> List[Dataset]:
        return self.db.query(Dataset).order_by(Dataset.created_at.desc()).all()
