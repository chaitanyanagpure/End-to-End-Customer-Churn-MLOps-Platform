from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.schemas.prediction import SinglePredictionIn, PredictionOut, BatchPredictionResponse
from app.services.prediction import PredictionService
from app.services.audit import AuditService
from app.repositories.prediction import PredictionRepository
from app.models.user import User
from typing import List

router = APIRouter()

@router.post("/single", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
def predict_single_customer(
    payload: SinglePredictionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    predict_service = PredictionService(db)
    audit_service = AuditService(db)
    
    prediction = predict_service.predict_single(payload, current_user.id)
    
    audit_service.log_action(
        current_user.id,
        "SINGLE_PREDICTION",
        f"Generated churn score for customer '{payload.customer_id}' (Prob: {prediction.churn_probability:.2%})."
    )
    
    return prediction

@router.post("/batch", response_model=BatchPredictionResponse, status_code=status.HTTP_201_CREATED)
async def predict_batch_customers(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    predict_service = PredictionService(db)
    audit_service = AuditService(db)
    
    contents = await file.read()
    
    total_records, high_risk_count, avg_prob, predictions, download_url = predict_service.predict_batch(
        file_content=contents,
        user_id=current_user.id
    )
    
    audit_service.log_action(
        current_user.id,
        "BATCH_PREDICTION",
        f"Scored batch file '{file.filename}' containing {total_records} rows. {high_risk_count} customers flagged at High Risk."
    )
    
    return {
        "total_records": total_records,
        "high_risk_count": high_risk_count,
        "average_churn_probability": avg_prob,
        "predictions": predictions,
        "download_url": download_url
    }

@router.get("/history", response_model=List[PredictionOut])
def get_prediction_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    predict_repo = PredictionRepository(db)
    return predict_repo.list_all()
