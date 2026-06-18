from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import mlflow
from app.api.dependencies import get_db, get_current_user
from app.repositories.model import ModelMetadataRepository
from app.core.config import settings
from app.core.logging import logger
from typing import List, Dict, Any

router = APIRouter()

@router.get("")
def get_experiments(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    # Connect to MLflow and fetch runs
    runs_list = []
    try:
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        experiment = mlflow.get_experiment_by_name("PredictWise_Churn_Experiment")
        if experiment:
            runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id])
            if not runs.empty:
                # Convert dataframe to a JSON serializable list of dicts
                for _, row in runs.iterrows():
                    # clean columns to return simple struct
                    run_data = {
                        "run_id": str(row.get("run_id", "")),
                        "status": str(row.get("status", "FINISHED")),
                        "start_time": str(row.get("start_time", "")),
                        "model_type": str(row.get("params.model_type", "Unknown")),
                        "metrics": {
                            "accuracy": float(row.get("metrics.accuracy", 0.0)),
                            "precision": float(row.get("metrics.precision", 0.0)),
                            "recall": float(row.get("metrics.recall", 0.0)),
                            "f1": float(row.get("metrics.f1", 0.0)),
                            "roc_auc": float(row.get("metrics.roc_auc", 0.0)),
                        },
                        "params": {}
                    }
                    # Extract remaining params
                    for col in runs.columns:
                        if col.startswith("params.") and col != "params.model_type":
                            param_name = col[7:]
                            run_data["params"][param_name] = str(row[col])
                    
                    runs_list.append(run_data)
                return runs_list
    except Exception as e:
        logger.warning(f"Failed to fetch runs from MLflow: {str(e)}. Falling back to DB model metadata.")

    # Fallback to local DB models if MLflow is not running
    model_repo = ModelMetadataRepository(db)
    models = model_repo.list_all()
    for model in models:
        runs_list.append({
            "run_id": model.run_id,
            "status": "FINISHED",
            "start_time": model.registered_at.isoformat(),
            "model_type": model.hyperparams_json.get("model_type", "Unknown") if model.hyperparams_json else "Unknown",
            "metrics": model.metrics_json or {
                "accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1": 0.0, "roc_auc": 0.0
            },
            "params": model.hyperparams_json or {}
        })
    return runs_list
