import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.core.database import Base

class RetrainingJob(Base):
    __tablename__ = "retraining_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(String, default="Pending", nullable=False) # "Pending", "Running", "Success", "Failed"
    trigger_type = Column(String, default="Manual", nullable=False) # "Manual", "Scheduled"
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    logs_s3_key = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    created_model_version = Column(String, nullable=True)
