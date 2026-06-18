import pytest
import pandas as pd
from app.ml.data_processor import DataProcessor
from app.services.prediction import PredictionService

def test_feature_engineering():
    processor = DataProcessor()
    df = pd.DataFrame([{
        "monthly_charges": 100.0,
        "total_charges": 500.0,
        "customer_engagement": 4,
        "support_tickets": 1
    }])
    
    df_eng = processor.engineer_features(df)
    
    # Check that engineered columns exist
    assert "charges_ratio" in df_eng.columns
    assert "engagement_rate" in df_eng.columns
    
    # Check calculations
    # charges_ratio = 100.0 / (500.0 + 1.0) = 100 / 501
    assert abs(df_eng["charges_ratio"].iloc[0] - (100.0 / 501.0)) < 1e-5
    # engagement_rate = 4 / (1 + 1) = 2.0
    assert df_eng["engagement_rate"].iloc[0] == 2.0

def test_retention_recommendation_logic():
    # Test rules matching within prediction service
    from sqlalchemy.orm import Session
    # Create mock/dummy session since we only call helper methods
    service = PredictionService(db=None)
    
    # 1. Test support ticket rule
    row = {"support_tickets": 4, "customer_engagement": 5, "contract_duration": 12, "payment_history": "On Time"}
    recs = service._generate_retention_recommendations(row, churn_prob=0.85)
    assert any("support tickets" in r.lower() for r in recs)
    
    # 2. Test month-to-month duration rule
    row2 = {"support_tickets": 0, "customer_engagement": 5, "contract_duration": 1, "payment_history": "On Time"}
    recs2 = service._generate_retention_recommendations(row2, churn_prob=0.50)
    assert any("annual" in r.lower() for r in recs2)
