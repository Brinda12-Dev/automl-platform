# ═══════════════════════════════════════════════════
# API/STATUS.PY — Endpoint statut de la tâche
# ═══════════════════════════════════════════════════
from fastapi import APIRouter
from celery.result import AsyncResult
from app.tasks.celery_tasks import celery_app

router = APIRouter()

@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    result = AsyncResult(task_id, app=celery_app)

    if result.state == 'PENDING':
        return {"status": "pending", "progress": {"step": "En attente...", "pct": 0}}

    elif result.state == 'PROGRESS':
        return {"status": "running", "progress": result.info or {}}

    elif result.state == 'SUCCESS':
        return {
            "status"       : "done",
            "result"       : result.result,
            "experiment_id": result.result.get('experiment_id') if result.result else None
        }

    elif result.state == 'FAILURE':
        return {
            "status": "failed",
            "error" : str(result.info)
        }

    return {"status": result.state.lower(), "progress": {}}