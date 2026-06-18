from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, List

class ModelMetadataOut(BaseModel):
    id: UUID
    model_name: str
    version: str
    run_id: str
    status: str
    metrics_json: Optional[Dict[str, float]] = None
    hyperparams_json: Optional[Dict[str, Any]] = None
    registered_at: datetime
    deployed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RetrainingJobOut(BaseModel):
    id: UUID
    status: str
    trigger_type: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    logs_s3_key: Optional[str] = None
    error_message: Optional[str] = None
    created_model_version: Optional[str] = None

    class Config:
        from_attributes = True

class TriggerRetrainIn(BaseModel):
    version: str
    dataset_id: Optional[UUID] = None
