import pandas as pd
import io
import json
from sqlalchemy.orm import Session
from app.repositories.dataset import DatasetRepository
from app.models.dataset import Dataset
from app.core.s3 import s3_client
from app.core.exceptions import ValidationError
from app.core.logging import logger
from app.ml.drift import drift_detector
from uuid import UUID
from typing import List, Dict, Any, Optional

class DatasetService:
    def __init__(self, db: Session):
        self.dataset_repo = DatasetRepository(db)
        self.expected_columns = {
            "customer_id": "object",
            "age": "int64",
            "gender": "object",
            "location": "object",
            "subscription_type": "object",
            "monthly_charges": "float64",
            "total_charges": "float64",
            "contract_duration": "int64",
            "customer_engagement": "int64",
            "support_tickets": "int64",
            "payment_history": "object"
        }

    def process_and_upload(
        self, file_content: bytes, filename: str, version: str, user_id: Optional[UUID]
    ) -> Dataset:
        # Check if version already exists
        existing = self.dataset_repo.get_by_version(version)
        if existing:
            raise ValidationError(detail=f"Dataset version '{version}' already exists.")

        try:
            # 1. Parse CSV
            df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            raise ValidationError(detail=f"Failed to parse CSV file: {str(e)}")

        # Adapt standard Kaggle Telco CSV structure if uploaded
        from app.ml.synthetic_data import adapt_kaggle_telco_csv
        df = adapt_kaggle_telco_csv(df)

        # 2. Validate columns schema
        for col, expected_type in self.expected_columns.items():
            if col not in df.columns:
                raise ValidationError(detail=f"Missing required column: {col}")

        # 3. Calculate descriptive statistics
        stats = self._calculate_descriptive_stats(df)
        schema_def = {col: str(df[col].dtype) for col in df.columns}

        # 4. Save adapted CSV to S3/MinIO
        s3_key = f"datasets/{version}/{filename}"
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        adapted_content = csv_buffer.getvalue().encode("utf-8")
        s3_client.upload_file(adapted_content, s3_key, content_type="text/csv")

        # 5. Check Data Drift if baseline exists
        drift_report_key = None
        datasets = self.dataset_repo.list_all()
        if len(datasets) > 0:
            # Get latest dataset as reference
            reference_meta = datasets[0]
            try:
                ref_bytes = s3_client.download_file(reference_meta.s3_key)
                ref_df = pd.read_csv(io.BytesIO(ref_bytes))
                
                drift_report_key = f"datasets/{version}/drift_report.html"
                drift_detector.generate_html_report(ref_df, df, drift_report_key)
            except Exception as e:
                logger.error(f"Failed to compute dataset drift: {str(e)}")

        # 6. Save metadata record to DB
        new_dataset = Dataset(
            name=filename,
            version=version,
            s3_key=s3_key,
            row_count=len(df),
            feature_count=len(df.columns) - 2 if "churn" in df.columns else len(df.columns) - 1, # ignore customer_id and churn
            schema_definition=schema_def,
            descriptive_stats=stats,
            drift_report_s3_key=drift_report_key,
            uploaded_by=user_id
        )
        
        return self.dataset_repo.create(new_dataset)

    def get_drift_metrics(self, dataset_id: UUID) -> Dict[str, Any]:
        dataset = self.dataset_repo.get_by_id(dataset_id)
        if not dataset:
            raise ValidationError("Dataset not found")

        # Check if there is an earlier dataset to compare with
        datasets = self.dataset_repo.list_all()
        # Find index of current dataset in list (reverse order)
        try:
            curr_idx = next(i for i, d in enumerate(datasets) if d.id == dataset_id)
        except StopIteration:
            raise ValidationError("Dataset not found in registration list")

        # If it's the oldest dataset, drift is 0
        if curr_idx == len(datasets) - 1:
            return {
                "drift_detected": False,
                "drift_ratio": 0.0,
                "message": "This is the baseline dataset. No previous version to compare."
            }

        reference_meta = datasets[curr_idx + 1] # Next oldest is the baseline for this one
        try:
            curr_bytes = s3_client.download_file(dataset.s3_key)
            ref_bytes = s3_client.download_file(reference_meta.s3_key)
            
            curr_df = pd.read_csv(io.BytesIO(curr_bytes))
            ref_df = pd.read_csv(io.BytesIO(ref_bytes))
            
            return drift_detector.calculate_drift(ref_df, curr_df)
        except Exception as e:
            logger.error(f"Failed to calculate drift metrics: {str(e)}")
            return {"error": str(e)}

    def _calculate_descriptive_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        stats = {
            "row_count": len(df),
            "col_count": len(df.columns),
            "missing_values": df.isnull().sum().to_dict(),
            "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "summary": {}
        }

        # Descriptive details for numerical columns
        numerical_cols = df.select_dtypes(include=["int64", "float64"]).columns
        for col in numerical_cols:
            stats["summary"][col] = {
                "mean": float(df[col].mean()),
                "median": float(df[col].median()),
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "std": float(df[col].std()) if len(df) > 1 else 0.0
            }

        # Unique counts for categoricals
        categorical_cols = df.select_dtypes(include=["object"]).columns
        for col in categorical_cols:
            value_counts = df[col].value_counts().head(10).to_dict()
            stats["summary"][col] = {
                "unique_count": int(df[col].nunique()),
                "top_values": {str(k): int(v) for k, v in value_counts.items()}
            }

        return stats
