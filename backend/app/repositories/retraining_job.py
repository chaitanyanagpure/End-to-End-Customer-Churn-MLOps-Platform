from sqlalchemy.orm import Session
from app.models.retraining_job import RetrainingJob
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class RetrainingJobRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, job_id: UUID) -> Optional[RetrainingJob]:
        return self.db.query(RetrainingJob).filter(RetrainingJob.id == job_id).first()

    def create(self, job: RetrainingJob) -> RetrainingJob:
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def list_all(self, limit: int = 50) -> List[RetrainingJob]:
        return self.db.query(RetrainingJob).order_by(RetrainingJob.started_at.desc()).limit(limit).all()

    def update_job(
        self, job_id: UUID, status: str, error_message: Optional[str] = None, created_model_version: Optional[str] = None
    ) -> Optional[RetrainingJob]:
        job = self.get_by_id(job_id)
        if job:
            job.status = status
            if status in ["Success", "Failed"]:
                job.ended_at = datetime.utcnow()
            if error_message:
                job.error_message = error_message
            if created_model_version:
                job.created_model_version = created_model_version
            self.db.commit()
            self.db.refresh(job)
        return job
