# ═══════════════════════════════════════════════════
# MODELS/USER.PY — Modèle SQLAlchemy table users
# ═══════════════════════════════════════════════════
from sqlalchemy import Column, String, DateTime
from datetime import datetime
import uuid
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    nom_complet     = Column(String(150), nullable=False)
    nom_entreprise  = Column(String(200), nullable=False)
    email           = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    pays            = Column(String(100), nullable=False)
    secteur         = Column(String(100), nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)
    last_login      = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id"             : self.id,
            "nom_complet"    : self.nom_complet,
            "nom_entreprise" : self.nom_entreprise,
            "email"          : self.email,
            "pays"           : self.pays,
            "secteur"        : self.secteur,
            "created_at"     : str(self.created_at),
            "last_login"     : str(self.last_login) if self.last_login else None,
        }