import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import pickle
from typing import Tuple, List, Dict, Any

class DataProcessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.numerical_cols = [
            "age", 
            "monthly_charges", 
            "total_charges", 
            "contract_duration", 
            "customer_engagement", 
            "support_tickets",
            "charges_ratio",
            "engagement_rate",
            "ticket_rate",
            "engagement_to_charges"
        ]
        self.categorical_cols = ["gender", "location", "subscription_type", "payment_history"]
        # Category mappings for manual one-hot encoding (retains column names and order cleanly for SHAP)
        self.category_mappings = {}
        self.is_fitted = False
 
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df_copy = df.copy()
        
        # Charges Ratio: monthly_charges divided by total_charges
        df_copy["charges_ratio"] = df_copy["monthly_charges"] / (df_copy["total_charges"] + 1.0)
        
        # Engagement Rate: engagement score divided by (tickets + 1)
        df_copy["engagement_rate"] = df_copy["customer_engagement"] / (df_copy["support_tickets"] + 1.0)
        
        # Ticket Rate: support_tickets divided by contract_duration
        df_copy["ticket_rate"] = df_copy["support_tickets"] / (df_copy["contract_duration"] + 0.1)
        
        # Engagement to Charges: customer_engagement divided by monthly_charges
        df_copy["engagement_to_charges"] = df_copy["customer_engagement"] / (df_copy["monthly_charges"] + 1.0)
        
        return df_copy

    def fit(self, df: pd.DataFrame):
        df_eng = self.engineer_features(df)
        
        # Learn categorical values mapping
        for col in self.categorical_cols:
            categories = sorted(list(df_eng[col].unique()))
            self.category_mappings[col] = categories
            
        # Fit scaler on numerical columns
        # Generate dummy one-hot columns first to match features during fit
        df_processed = self._encode_categorical(df_eng)
        self.scaler.fit(df_processed[self.numerical_cols])
        self.is_fitted = True

    def _encode_categorical(self, df: pd.DataFrame) -> pd.DataFrame:
        df_res = df.copy()
        for col, categories in self.category_mappings.items():
            for cat in categories:
                df_res[f"{col}_{cat}"] = (df_res[col] == cat).astype(float)
        return df_res

    def transform(self, df: pd.DataFrame, is_inference: bool = False) -> pd.DataFrame:
        if not self.is_fitted:
            raise ValueError("Processor must be fitted before transformation.")
            
        df_eng = self.engineer_features(df)
        df_encoded = self._encode_categorical(df_eng)
        
        # Scale numerical variables
        df_encoded[self.numerical_cols] = self.scaler.transform(df_encoded[self.numerical_cols])
        
        # Select features for model input
        feature_cols = []
        feature_cols.extend(self.numerical_cols)
        for col, categories in self.category_mappings.items():
            for cat in categories:
                feature_cols.append(f"{col}_{cat}")
                
        # Fill any missing columns (e.g. category not present in inference set) with 0
        for col in feature_cols:
            if col not in df_encoded.columns:
                df_encoded[col] = 0.0
                
        return df_encoded[feature_cols]

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        self.fit(df)
        return self.transform(df)

    def split_features_target(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        X = df.drop(columns=["customer_id", "churn"], errors="ignore")
        y = df["churn"] if "churn" in df.columns else None
        return X, y

    def serialize(self) -> bytes:
        return pickle.dumps(self)

    @staticmethod
    def deserialize(data: bytes) -> 'DataProcessor':
        return pickle.loads(data)
