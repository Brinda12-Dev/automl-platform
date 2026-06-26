# ═══════════════════════════════════════════════════
# API/PREDICT.PY — Endpoint de prédiction sur nouvelles données
# ═══════════════════════════════════════════════════
import os
import pickle
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any
from app.database import get_db
from app.models.experiment import Experiment

router = APIRouter()

MODELS_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', '..', 'models'
)

class PredictRequest(BaseModel):
    experiment_id : str
    values        : Dict[str, Any]

@router.post("/predict")
async def predict(req: PredictRequest, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == req.experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience introuvable")

    if exp.status != 'done':
        raise HTTPException(status_code=400, detail="Cette experience n'est pas terminee")

    model_path = os.path.join(MODELS_DIR, f"{req.experiment_id}_model.pkl")
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Fichier modele introuvable")

    with open(model_path, 'rb') as f:
        model = pickle.load(f)

    feature_names = exp.feature_names or []
    missing = [f for f in feature_names if f not in req.values]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Valeurs manquantes pour : {missing}"
        )

    input_df = pd.DataFrame([{f: req.values[f] for f in feature_names}])

    try:
        prediction = model.predict(input_df)[0]

        result = {
            "experiment_id" : req.experiment_id,
            "dataset_name"  : exp.dataset_name,
            "target_column" : exp.target_column,
            "prediction"    : prediction.item() if hasattr(prediction, 'item') else prediction,
        }

        try:
            proba = model.predict_proba(input_df)[0]
            result["probabilities"] = proba.tolist()
            result["confidence"]    = float(max(proba))
        except Exception:
            result["probabilities"] = None
            result["confidence"]    = None

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de prediction : {str(e)}")