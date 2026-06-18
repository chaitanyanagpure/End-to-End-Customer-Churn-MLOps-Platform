from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.prediction import Prediction
from typing import List, Optional, Dict, Any
from uuid import UUID

class PredictionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, prediction_id: UUID) -> Optional[Prediction]:
        return self.db.query(Prediction).filter(Prediction.id == prediction_id).first()

    def create(self, prediction: Prediction) -> Prediction:
        self.db.add(prediction)
        self.db.commit()
        self.db.refresh(prediction)
        return prediction

    def list_all(self, limit: int = 100000) -> List[Prediction]:
        return self.db.query(Prediction).order_by(Prediction.created_at.desc()).limit(limit).all()

    def get_summary_metrics(self) -> Dict[str, Any]:
        # Calculate summary statistics for the dashboard
        total_predictions = self.db.query(Prediction).count()
        if total_predictions == 0:
            return {
                "total_customers": 0,
                "high_risk_customers": 0,
                "average_churn_probability": 0.0
            }
        
        high_risk_count = self.db.query(Prediction).filter(Prediction.risk_category == "High").count()
        avg_churn = self.db.query(func.avg(Prediction.churn_probability)).scalar() or 0.0
        
        return {
            "total_customers": total_predictions,
            "high_risk_customers": high_risk_count,
            "average_churn_probability": float(avg_churn)
        }
