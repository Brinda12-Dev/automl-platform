# ═══════════════════════════════════════════════════
# CORE/SECURITY.PY — Hashage bcrypt + JWT
# ═══════════════════════════════════════════════════
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# Clé secrète pour signer les tokens JWT
SECRET_KEY = "lightweight_ai_secret_key_2026_pme_africaines"
ALGORITHM  = "HS256"

# Durée de session : 1 mois
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Contexte de hashage bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashe un mot de passe en clair avec bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie qu'un mot de passe correspond au hash stocké."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Génère un token JWT avec expiration de 30 jours."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Décode un token JWT. Retourne None si invalide ou expiré."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None