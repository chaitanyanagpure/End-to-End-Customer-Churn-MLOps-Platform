import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.core.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(String, index=True, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    location = Column(String, nullable=False)
    subscription_type = Column(String, nullable=False)
    monthly_charges = Column(Float, nullable=False)
    total_charges = Column(Float, nullable=False)
    contract_duration = Column(Integer, nullable=False)
    customer_engagement = Column(Integer, nullable=False)
    support_tickets = Column(Integer, nullable=False)
    payment_history = Column(String, nullable=False)
    
    # Inference Results
    churn_probability = Column(Float, nullable=False)
    risk_category = Column(String, nullable=False) # "Low", "Medium", "High"
    explanation_json = Column(JSON, nullable=True) # SHAP values
    retention_suggestions = Column(JSON, nullable=True) # Actionable recommendations
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
