# ═══════════════════════════════════════════════════
# API/UPLOAD.PY — Endpoint upload CSV
# ═══════════════════════════════════════════════════
import os
import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'datasets', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    # Vérifier que c'est un CSV
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Seuls les fichiers CSV sont acceptes")

    # Sauvegarder le fichier
    dataset_id   = str(uuid.uuid4())
    filename     = f"{dataset_id}_{file.filename}"
    filepath     = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, 'wb') as f:
        f.write(content)

    # Analyser le dataset
    df = pd.read_csv(filepath)

    # Profiling rapide
    profile = {
        "rows"        : int(df.shape[0]),
        "cols"        : int(df.shape[1]),
        "columns"     : df.columns.tolist(),
        "missing_pct" : round(df.isnull().sum().sum() / (df.shape[0] * df.shape[1]) * 100, 2),
        "dtypes"      : {col: str(dtype) for col, dtype in df.dtypes.items()},
        "sample"      : df.head(5).to_dict('records'),
    }

    return {
        "dataset_id"  : dataset_id,
        "filename"    : file.filename,
        "filepath"    : filepath,
        "profile"     : profile,
        "message"     : "Dataset charge avec succes"
    }