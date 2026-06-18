import uuid
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.core.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    version = Column(String, unique=True, nullable=False, index=True)
    s3_key = Column(String, nullable=False)
    row_count = Column(Integer, nullable=False)
    feature_count = Column(Integer, nullable=False)
    schema_definition = Column(JSON, nullable=True) # Column types mapping
    descriptive_stats = Column(JSON, nullable=True) # Summary metrics like missing, mean, etc.
    drift_report_s3_key = Column(String, nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
