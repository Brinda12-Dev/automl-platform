# ═══════════════════════════════════════════════════
# MAIN.PY — Application FastAPI principale
# ═══════════════════════════════════════════════════
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import user, experiment  # ← NOUVEAU : importer les deux modèles
from app.api import upload, automl, status, results, predict, auth  # ← NOUVEAU : auth

# Créer toutes les tables (users + experiments)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title       = "AutoML Platform API",
    description = "Plateforme Lightweight AI pour les PME africaines",
    version     = "1.0.0"
)

# Configuration CORS pour le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# Inclusion des routes
app.include_router(auth.router,    prefix="/api", tags=["Auth"])       # ← NOUVEAU
app.include_router(upload.router,  prefix="/api", tags=["Upload"])
app.include_router(automl.router,  prefix="/api", tags=["AutoML"])
app.include_router(status.router,  prefix="/api", tags=["Status"])
app.include_router(results.router, prefix="/api", tags=["Results"])
app.include_router(predict.router, prefix="/api", tags=["Predict"])

@app.get("/")
async def root():
    return {
        "message" : "AutoML Platform API",
        "version" : "1.0.0",
        "docs"    : "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "AutoML Platform"}