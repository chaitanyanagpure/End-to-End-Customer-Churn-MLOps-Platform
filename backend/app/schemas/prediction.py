from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any

class SinglePredictionIn(BaseModel):
    customer_id: str = Field(..., description="Unique customer identifier")
    age: int = Field(..., ge=18, le=120)
    gender: str = Field(..., pattern="^(Male|Female)$")
    location: str = Field(..., min_length=1)
    subscription_type: str = Field(..., pattern="^(Basic|Standard|Premium)$")
    monthly_charges: float = Field(..., ge=0)
    total_charges: float = Field(..., ge=0)
    contract_duration: int = Field(..., ge=1, le=36)
    customer_engagement: int = Field(..., ge=1, le=5)
    support_tickets: int = Field(..., ge=0)
    payment_history: str = Field(..., pattern="^(On Time|Delayed|Missed)$")

class SHAPImpactOut(BaseModel):
    feature: str
    impact: float
    value: Any

class PredictionOut(BaseModel):
    id: UUID
    customer_id: str
    age: int
    gender: str
    location: str
    subscription_type: str
    monthly_charges: float
    total_charges: float
    contract_duration: int
    customer_engagement: int
    support_tickets: int
    payment_history: str
    churn_probability: float
    risk_category: str
    explanation_json: Optional[List[SHAPImpactOut]] = None
    retention_suggestions: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BatchPredictionResponse(BaseModel):
    total_records: int
    high_risk_count: int
    average_churn_probability: float
    predictions: List[PredictionOut]
    download_url: Optional[str] = None
