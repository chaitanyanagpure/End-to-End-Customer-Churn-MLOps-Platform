import pandas as pd
import io
import pickle
import json
from sqlalchemy.orm import Session
from app.repositories.prediction import PredictionRepository
from app.repositories.model import ModelMetadataRepository
from app.models.prediction import Prediction
from app.schemas.prediction import SinglePredictionIn
from app.core.s3 import s3_client
from app.core.exceptions import ValidationError
from app.core.logging import logger
from app.ml.data_processor import DataProcessor
from app.ml.explain import SHAPExplainerService
from uuid import UUID
from typing import List, Dict, Any, Tuple, Optional

# In-memory cache for the loaded model and processor to minimize S3 fetch latency
_MODEL_CACHE: Dict[str, Any] = {}

class PredictionService:
    def __init__(self, db: Session):
        self.db = db
        self.predict_repo = PredictionRepository(db)
        self.model_repo = ModelMetadataRepository(db)

    def _get_active_model_artifacts(self) -> Tuple[Any, DataProcessor, str]:
        """
        Retrieves the active production model and processor. 
        Falls back to the latest model in the registry if no model is set to Production.
        """
        # Find active production model
        model_meta = self.model_repo.get_active_model()
        if not model_meta:
            # Fallback: get latest model registered
            models = self.model_repo.list_all()
            if not models:
                raise ValidationError("No trained machine learning model is registered. Retrain the model first.")
            model_meta = models[0]
            logger.warning(f"No active 'Production' model found. Falling back to latest model version: {model_meta.version}")
            
        version = model_meta.version
        
        # Check cache
        if version in _MODEL_CACHE:
            return _MODEL_CACHE[version]["model"], _MODEL_CACHE[version]["processor"], version
            
        try:
            logger.info(f"Loading artifacts for model version '{version}' from S3...")
            model_bytes = s3_client.download_file(f"models/{version}/model.pkl")
            processor_bytes = s3_client.download_file(f"models/{version}/processor.pkl")
            
            model = pickle.loads(model_bytes)
            processor = DataProcessor.deserialize(processor_bytes)
            
            # Cache artifacts
            _MODEL_CACHE[version] = {
                "model": model,
                "processor": processor
            }
            return model, processor, version
        except Exception as e:
            logger.error(f"Failed to load model version '{version}' artifacts: {str(e)}")
            raise ValidationError(detail=f"Model loading failed: {str(e)}")

    def predict_single(self, data: SinglePredictionIn, user_id: Optional[UUID]) -> Prediction:
        # 1. Fetch model and processor
        model, processor, version = self._get_active_model_artifacts()

        # 2. Build single-row DataFrame
        raw_row = {
            "customer_id": data.customer_id,
            "age": data.age,
            "gender": data.gender,
            "location": data.location,
            "subscription_type": data.subscription_type,
            "monthly_charges": data.monthly_charges,
            "total_charges": data.total_charges,
            "contract_duration": data.contract_duration,
            "customer_engagement": data.customer_engagement,
            "support_tickets": data.support_tickets,
            "payment_history": data.payment_history
        }
        df_raw = pd.DataFrame([raw_row])

        # 3. Transform inputs
        X_processed = processor.transform(df_raw, is_inference=True)

        # 4. Predict churn probability
        probs = model.predict_proba(X_processed)[0]
        churn_prob = float(probs[1])

        # 5. Classify risk level
        if churn_prob >= 0.70:
            risk_category = "High"
        elif churn_prob >= 0.30:
            risk_category = "Medium"
        else:
            risk_category = "Low"

        # 6. Generate SHAP explainability
        explanation = SHAPExplainerService.explain_prediction(
            model=model,
            processor=processor,
            X_processed=X_processed,
            raw_row=pd.Series(raw_row)
        )

        # 7. Generate Retention Recommendations
        retention = self._generate_retention_recommendations(raw_row, churn_prob)

        # 8. Log Prediction to Database
        prediction_record = Prediction(
            customer_id=data.customer_id,
            age=data.age,
            gender=data.gender,
            location=data.location,
            subscription_type=data.subscription_type,
            monthly_charges=data.monthly_charges,
            total_charges=data.total_charges,
            contract_duration=data.contract_duration,
            customer_engagement=data.customer_engagement,
            support_tickets=data.support_tickets,
            payment_history=data.payment_history,
            churn_probability=churn_prob,
            risk_category=risk_category,
            explanation_json=explanation,
            retention_suggestions=retention,
            created_by=user_id
        )

        return self.predict_repo.create(prediction_record)

    def predict_batch(self, file_content: bytes, user_id: Optional[UUID]) -> Tuple[int, int, float, List[Prediction], str]:
        # 1. Parse CSV
        try:
            df_raw = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            raise ValidationError(detail=f"Failed to parse batch CSV file: {str(e)}")

        # Adapt standard Kaggle Telco CSV structure if uploaded
        from app.ml.synthetic_data import adapt_kaggle_telco_csv
        df_raw = adapt_kaggle_telco_csv(df_raw)

        # Validate columns
        required_cols = [
            "customer_id", "age", "gender", "location", "subscription_type", 
            "monthly_charges", "total_charges", "contract_duration", 
            "customer_engagement", "support_tickets", "payment_history"
        ]
        for col in required_cols:
            if col not in df_raw.columns:
                raise ValidationError(detail=f"Missing required batch CSV column: {col}")

        # 2. Score batch
        model, processor, version = self._get_active_model_artifacts()
        
        # Transform all rows
        X_processed = processor.transform(df_raw, is_inference=True)
        probs = model.predict_proba(X_processed)[:, 1]

        predictions_list = []
        high_risk_count = 0
        total_prob = 0.0

        for idx, row in df_raw.iterrows():
            churn_prob = float(probs[idx])
            total_prob += churn_prob

            if churn_prob >= 0.70:
                risk_category = "High"
                high_risk_count += 1
            elif churn_prob >= 0.30:
                risk_category = "Medium"
            else:
                risk_category = "Low"

            # Quick local SHAP explainer
            explanation = SHAPExplainerService.explain_prediction(
                model=model,
                processor=processor,
                X_processed=X_processed.iloc[[idx]],
                raw_row=row
            )

            # Recommendations
            retention = self._generate_retention_recommendations(row.to_dict(), churn_prob)

            prediction_record = Prediction(
                customer_id=str(row["customer_id"]),
                age=int(row["age"]),
                gender=str(row["gender"]),
                location=str(row["location"]),
                subscription_type=str(row["subscription_type"]),
                monthly_charges=float(row["monthly_charges"]),
                total_charges=float(row["total_charges"]),
                contract_duration=int(row["contract_duration"]),
                customer_engagement=int(row["customer_engagement"]),
                support_tickets=int(row["support_tickets"]),
                payment_history=str(row["payment_history"]),
                churn_probability=churn_prob,
                risk_category=risk_category,
                explanation_json=explanation,
                retention_suggestions=retention,
                created_by=user_id
            )
            # Create in database session
            self.db.add(prediction_record)
            predictions_list.append(prediction_record)

        self.db.commit()

        # 3. Create batch CSV download output file
        df_scored = df_raw.copy()
        df_scored["churn_probability"] = probs
        df_scored["risk_category"] = ["High" if p >= 0.7 else "Medium" if p >= 0.3 else "Low" for p in probs]
        
        output_buffer = io.StringIO()
        df_scored.to_csv(output_buffer, index=False)
        scored_csv_bytes = output_buffer.getvalue().encode("utf-8")
        
        # Upload batch results to S3
        import uuid
        batch_id = uuid.uuid4().hex[:8]
        s3_key = f"predictions/batch_{batch_id}_results.csv"
        s3_client.upload_file(scored_csv_bytes, s3_key, content_type="text/csv")
        
        # Generate presigned download URL valid for 24 hours
        download_url = s3_client.get_presigned_url(s3_key, expires_in_seconds=86400)

        # Refresh objects
        for pred in predictions_list:
            self.db.refresh(pred)

        avg_prob = total_prob / len(df_raw) if len(df_raw) > 0 else 0.0

        return len(df_raw), high_risk_count, avg_prob, predictions_list, download_url

    def _generate_retention_recommendations(self, row: dict, churn_prob: float) -> List[str]:
        suggestions = []
        
        if churn_prob < 0.30:
            suggestions.append("Maintain baseline engagement. Customer is highly stable.")
            return suggestions

        # High ticket issue
        if int(row.get("support_tickets", 0)) >= 3:
            suggestions.append("Schedule a priority follow-up call from the Account Management team to resolve open support tickets.")
        
        # Engagement drops
        if int(row.get("customer_engagement", 5)) <= 2:
            suggestions.append("Trigger a product training session or features spotlight email to boost user engagement.")
            
        # Contract duration 1 month (Risk of leaving immediately)
        if int(row.get("contract_duration", 12)) == 1:
            suggestions.append("Offer a 15% discount incentive to transition from monthly billing to an annual subscription plan.")

        # Payment details issues
        if row.get("payment_history") in ["Missed", "Delayed"]:
            suggestions.append("Offer flexible payment schedule adjustments or active credit cards auto-pay setups.")

        # High spending comparison
        if float(row.get("monthly_charges", 0)) >= 100.0:
            suggestions.append("Promote standard loyalty pricing or review multi-seat pricing optimization options.")

        if not suggestions:
            suggestions.append("Initiate standard feedback survey to analyze customer happiness indices.")

        return suggestions
