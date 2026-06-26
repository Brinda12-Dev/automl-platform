# ═══════════════════════════════════════════════════
# API/RESULTS.PY — Endpoints résultats + download
# ═══════════════════════════════════════════════════
import os
import pickle
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.experiment import Experiment
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter()

MODELS_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', '..', 'models'
)
os.makedirs(MODELS_DIR, exist_ok=True)

@router.get("/results/{experiment_id}")
async def get_results(
    experiment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ← NOUVEAU
):
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.user_id == current_user.id  # ← NOUVEAU : filtrage par user
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience non trouvee")
    return exp.to_dict()

@router.get("/experiments")
async def list_experiments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ← NOUVEAU
):
    # ← NOUVEAU : chaque utilisateur ne voit que ses propres expériences
    exps = db.query(Experiment)\
             .filter(Experiment.user_id == current_user.id)\
             .order_by(Experiment.created_at.desc())\
             .limit(20).all()
    return [e.to_dict() for e in exps]

@router.delete("/experiments/{experiment_id}")
async def delete_experiment(
    experiment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ← NOUVEAU
):
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.user_id == current_user.id  # ← NOUVEAU
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience non trouvee")
    db.delete(exp)
    db.commit()
    return {"message": "Experience supprimee"}

@router.get("/download/{experiment_id}/model")
async def download_model(
    experiment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ← NOUVEAU
):
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.user_id == current_user.id  # ← NOUVEAU
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience non trouvee")
    if exp.status != 'done':
        raise HTTPException(
            status_code=400,
            detail=f"Experience pas encore terminee (status: {exp.status})"
        )

    model_path = os.path.join(MODELS_DIR, f"{experiment_id}_model.pkl")
    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=404,
            detail="Modele non trouve sur le disque"
        )

    return FileResponse(
        path       = model_path,
        filename   = f"automl_model_{exp.dataset_name[:8]}.pkl",
        media_type = "application/octet-stream"
    )

@router.get("/experiments/summary")
async def experiments_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ← NOUVEAU
):
    # ← NOUVEAU : statistiques uniquement sur les expériences de l'utilisateur
    exps  = db.query(Experiment)\
              .filter(Experiment.user_id == current_user.id).all()
    total   = len(exps)
    done    = len([e for e in exps if e.status == 'done'])
    failed  = len([e for e in exps if e.status == 'failed'])
    pending = len([e for e in exps if e.status == 'pending'])
    best_f1 = max((e.f1_score for e in exps if e.f1_score), default=0)
    return {
        "total"   : total,
        "done"    : done,
        "failed"  : failed,
        "pending" : pending,
        "best_f1" : round(best_f1, 4),
    }