import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.core.database import Base

class ModelMetadata(Base):
    __tablename__ = "models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name = Column(String, default="customer_churn_model", nullable=False)
    version = Column(String, unique=True, nullable=False, index=True)
    run_id = Column(String, nullable=False) # MLflow Run ID
    status = Column(String, default="Staging", nullable=False) # "Archived", "Staging", "Production"
    metrics_json = Column(JSON, nullable=True) # F1, Recall, Accuracy, AUC
    hyperparams_json = Column(JSON, nullable=True) # Optuna tuned params
    registered_at = Column(DateTime, default=datetime.utcnow)
    deployed_at = Column(DateTime, nullable=True)
