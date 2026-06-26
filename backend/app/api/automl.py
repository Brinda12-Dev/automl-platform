# ═══════════════════════════════════════════════════
# API/AUTOML.PY — Endpoint lancement AutoML
# ═══════════════════════════════════════════════════
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.experiment import Experiment
from app.api.auth import get_current_user
from app.models.user import User
from datetime import datetime

router = APIRouter()

class AutoMLConfig(BaseModel):
    dataset_id    : str
    dataset_path  : str
    target_column : str
    task_type     : str = "classification"
    time_budget   : int = 120
    framework     : str = "flaml"

@router.post("/run-automl")
async def run_automl(
    config: AutoMLConfig,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ← NOUVEAU
):
    from app.tasks.celery_tasks import run_automl_task

    experiment_id = str(uuid.uuid4())

    exp = Experiment(
        id            = experiment_id,
        user_id       = current_user.id,  # ← NOUVEAU : lier à l'utilisateur
        dataset_name  = config.dataset_id,
        target_column = config.target_column,
        task_type     = config.task_type,
        time_budget   = config.time_budget,
        status        = 'pending',
        created_at    = datetime.utcnow()
    )
    db.add(exp)
    db.commit()

    task_config = {
        'experiment_id': experiment_id,
        'dataset_path' : config.dataset_path,
        'target_column': config.target_column,
        'task_type'    : config.task_type,
        'time_budget'  : config.time_budget,
        'framework'    : config.framework,
    }
    task = run_automl_task.delay(task_config)

    return {
        "task_id"      : task.id,
        "experiment_id": experiment_id,
        "status"       : "pending",
        "framework"    : config.framework,
        "message"      : f"Entrainement {config.framework.upper()} lance en arriere-plan"
    }