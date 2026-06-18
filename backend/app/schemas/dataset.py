from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, List

class DatasetOut(BaseModel):
    id: UUID
    name: str
    version: str
    s3_key: str
    row_count: int
    feature_count: int
    schema_definition: Optional[Dict[str, str]] = None
    descriptive_stats: Optional[Dict[str, Any]] = None
    drift_report_s3_key: Optional[str] = None
    uploaded_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FeatureDriftDetail(BaseModel):
    method: str
    p_value: float
    statistic: float
    drift_detected: bool

class DriftReportOut(BaseModel):
    drift_detected: bool
    drift_ratio: float
    drifted_features: List[str] = []
    features: Optional[Dict[str, FeatureDriftDetail]] = None
    message: Optional[str] = None
