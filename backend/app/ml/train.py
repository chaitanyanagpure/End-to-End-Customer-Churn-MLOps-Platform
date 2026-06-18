import pandas as pd
import numpy as np
import optuna
import mlflow
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

from app.ml.data_processor import DataProcessor
from app.ml.evaluate import evaluate_model_performance
from app.core.config import settings
from app.core.logging import logger
from app.core.s3 import s3_client

# Suppress Optuna logs to prevent clutter
optuna.logging.set_verbosity(optuna.logging.WARNING)

class MLPipelineTrainer:
    def __init__(self, tracking_uri: str = settings.MLFLOW_TRACKING_URI):
        self.tracking_uri = tracking_uri

    def run_training_pipeline(self, df: pd.DataFrame, version: str) -> dict:
        try:
            mlflow.set_tracking_uri(self.tracking_uri)
            mlflow.set_experiment("PredictWise_Churn_Experiment")
        except Exception as e:
            logger.warning(f"Could not connect to MLflow tracking server: {str(e)}. Running with fallback logs.")
            
        logger.info(f"Starting ML Training pipeline for version {version} with {len(df)} records.")
        
        # 1. Split features and target
        X = df.drop(columns=["customer_id", "churn"], errors="ignore")
        y = df["churn"]
        
        X_train_raw, X_val_raw, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # 2. Fit processor and transform data
        processor = DataProcessor()
        X_train = processor.fit_transform(X_train_raw)
        X_val = processor.transform(X_val_raw)
        
        # 3. Perform Hyperparameter Optimization with Optuna
        logger.info("Starting hyperparameter optimization sweep using Optuna...")
        study = optuna.create_study(direction="maximize")
        study.optimize(lambda trial: self._optuna_objective(trial, X_train, y_train, X_val, y_val), n_trials=40)
        
        best_params = study.best_params
        best_model_type = best_params.pop("model_type")
        logger.info(f"Optuna complete. Best Model Type: {best_model_type}. Best Validation F1: {study.best_value:.4f}")
        
        # 4. Train best model with the optimal parameters
        champion_model = self._instantiate_model(best_model_type, best_params)
        champion_model.fit(X_train, y_train)
        
        # 5. Evaluate Champion Model
        val_preds = champion_model.predict(X_val)
        val_probs = champion_model.predict_proba(X_val)[:, 1]
        metrics = evaluate_model_performance(y_val, val_preds, val_probs)
        logger.info(f"Champion evaluation: {metrics}")
        
        # 6. Register Model & Log to MLflow
        run_id = "local_run"
        try:
            with mlflow.start_run() as run:
                run_id = run.info.run_id
                logger.info(f"Logging metrics and artifacts to MLflow. Run ID: {run_id}")
                
                # Log params & metrics
                mlflow.log_param("model_type", best_model_type)
                for param_name, param_val in best_params.items():
                    mlflow.log_param(param_name, param_val)
                    
                for metric_name, metric_val in metrics.items():
                    mlflow.log_metric(metric_name, metric_val)
                
                # Log model & processor as artifacts
                mlflow.log_dict(metrics, "validation_metrics.json")
                mlflow.log_dict(best_params, "hyperparameters.json")
        except Exception as e:
            logger.warning(f"Failed to log run to MLflow: {str(e)}. Proceeding with S3 artifact registration.")
            
        # 7. Serialize and upload artifacts directly to MinIO/S3 (For fallback/direct serving)
        # We save as raw pickles for inference
        model_payload = pickle.dumps(champion_model)
        processor_payload = processor.serialize()
        
        s3_client.upload_file(model_payload, f"models/{version}/model.pkl")
        s3_client.upload_file(processor_payload, f"models/{version}/processor.pkl")
        
        return {
            "version": version,
            "run_id": run_id,
            "model_type": best_model_type,
            "metrics": metrics,
            "hyperparameters": best_params
        }
 
    def _optuna_objective(self, trial, X_train, y_train, X_val, y_val) -> float:
        model_type = trial.suggest_categorical("model_type", ["XGBoost", "LightGBM", "RandomForest"])
        
        if model_type == "XGBoost":
            params = {
                "max_depth": trial.suggest_int("xgb_max_depth", 3, 9),
                "learning_rate": trial.suggest_float("xgb_learning_rate", 0.01, 0.3, log=True),
                "n_estimators": trial.suggest_int("xgb_n_estimators", 50, 200),
                "subsample": trial.suggest_float("xgb_subsample", 0.6, 1.0),
                "colsample_bytree": trial.suggest_float("xgb_colsample_bytree", 0.6, 1.0),
                "use_label_encoder": False,
                "eval_metric": "logloss",
                "random_state": 42
            }
            model = XGBClassifier(**params)
        elif model_type == "LightGBM":
            params = {
                "max_depth": trial.suggest_int("lgb_max_depth", 3, 9),
                "learning_rate": trial.suggest_float("lgb_learning_rate", 0.01, 0.3, log=True),
                "n_estimators": trial.suggest_int("lgb_n_estimators", 50, 200),
                "subsample": trial.suggest_float("lgb_subsample", 0.6, 1.0),
                "colsample_bytree": trial.suggest_float("lgb_colsample_bytree", 0.6, 1.0),
                "verbose": -1,
                "random_state": 42
            }
            model = LGBMClassifier(**params)
        else: # RandomForest
            params = {
                "max_depth": trial.suggest_int("rf_max_depth", 5, 20),
                "n_estimators": trial.suggest_int("rf_n_estimators", 50, 200),
                "min_samples_split": trial.suggest_int("rf_min_samples_split", 2, 10),
                "min_samples_leaf": trial.suggest_int("rf_min_samples_leaf", 1, 4),
                "random_state": 42
            }
            model = RandomForestClassifier(**params)
            
        model.fit(X_train, y_train)
        preds = model.predict(X_val)
        probs = model.predict_proba(X_val)[:, 1]
        metrics = evaluate_model_performance(y_val, preds, probs)
        
        # Optimize for validation F1 score
        return metrics["f1"]

    def _instantiate_model(self, model_type: str, params: dict):
        # Cleans out prefix from optuna suggest names
        cleaned_params = {}
        for k, v in params.items():
            cleaned_key = k
            if k.startswith("xgb_"): cleaned_key = k[4:]
            elif k.startswith("lgb_"): cleaned_key = k[4:]
            elif k.startswith("rf_"): cleaned_key = k[3:]
            cleaned_params[cleaned_key] = v

        if model_type == "XGBoost":
            return XGBClassifier(use_label_encoder=False, eval_metric="logloss", random_state=42, **cleaned_params)
        elif model_type == "LightGBM":
            return LGBMClassifier(verbose=-1, random_state=42, **cleaned_params)
        else:
            return RandomForestClassifier(random_state=42, **cleaned_params)

trainer = MLPipelineTrainer()
