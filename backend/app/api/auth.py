# ═══════════════════════════════════════════════════
# API/AUTH.PY — Endpoints Register + Login + Me + Profile
# ═══════════════════════════════════════════════════
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.core.security import (
    hash_password, verify_password,
    create_access_token, decode_access_token
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Schémas Pydantic ─────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    nom_complet     : str
    nom_entreprise  : str
    email           : str
    password        : str
    confirm_password: str
    pays            : str
    secteur         : str

class LoginRequest(BaseModel):
    email    : str
    password : str

class UpdateProfileRequest(BaseModel):          # ← NOUVEAU
    nom_complet    : str
    nom_entreprise : str
    email          : str
    pays           : str
    secteur        : str

class ChangePasswordRequest(BaseModel):         # ← NOUVEAU
    current_password : str
    new_password     : str
    confirm_password : str


# ── Dépendance — utilisateur courant ─────────────────────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré. Veuillez vous reconnecter.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable.",
        )
    return user


# ── Endpoint : Inscription ────────────────────────────────────────────────────
@router.post("/auth/register", status_code=201)
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400,
            detail="Les mots de passe ne correspondent pas.")

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400,
            detail="Un compte existe déjà avec cet email.")

    user = User(
        nom_complet     = req.nom_complet,
        nom_entreprise  = req.nom_entreprise,
        email           = req.email,
        hashed_password = hash_password(req.password),
        pays            = req.pays,
        secteur         = req.secteur,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.id})
    return {
        "access_token" : token,
        "token_type"   : "bearer",
        "user"         : user.to_dict()
    }


# ── Endpoint : Connexion ──────────────────────────────────────────────────────
@router.post("/auth/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401,
            detail="Email ou mot de passe incorrect.")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(data={"sub": user.id})
    return {
        "access_token" : token,
        "token_type"   : "bearer",
        "user"         : user.to_dict()
    }


# ── Endpoint : Profil utilisateur courant ────────────────────────────────────
@router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()


# ── Endpoint : Vérification token ────────────────────────────────────────────
@router.get("/auth/verify")
async def verify_token(current_user: User = Depends(get_current_user)):
    return {
        "valid" : True,
        "user"  : current_user.to_dict()
    }


# ── Endpoint : Modifier le profil ── ← NOUVEAU ───────────────────────────────
@router.put("/auth/profile")
async def update_profile(
    req: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Vérifier si le nouvel email est déjà utilisé par un autre utilisateur
    if req.email != current_user.email:
        existing = db.query(User).filter(
            User.email == req.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400,
                detail="Cet email est déjà utilisé par un autre compte.")

    current_user.nom_complet    = req.nom_complet
    current_user.nom_entreprise = req.nom_entreprise
    current_user.email          = req.email
    current_user.pays           = req.pays
    current_user.secteur        = req.secteur
    db.commit()
    db.refresh(current_user)

    return current_user.to_dict()


# ── Endpoint : Changer le mot de passe ── ← NOUVEAU ──────────────────────────
@router.put("/auth/password")
async def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Vérifier le mot de passe actuel
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400,
            detail="Mot de passe actuel incorrect.")

    # Vérifier que les nouveaux mots de passe correspondent
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400,
            detail="Les nouveaux mots de passe ne correspondent pas.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400,
            detail="Le mot de passe doit contenir au moins 6 caractères.")

    current_user.hashed_password = hash_password(req.new_password)
    db.commit()

    return {"message": "Mot de passe modifié avec succès."}


# ── Endpoint : Supprimer le compte ── ← NOUVEAU ──────────────────────────────
@router.delete("/auth/profile")
async def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.experiment import Experiment

    # Supprimer toutes les expériences de l'utilisateur
    db.query(Experiment).filter(
        Experiment.user_id == current_user.id
    ).delete()

    # Supprimer l'utilisateur
    db.delete(current_user)
    db.commit()

    return {"message": "Compte supprimé avec succès."}