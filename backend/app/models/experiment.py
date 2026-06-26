# ═══════════════════════════════════════════════════
# MODELS/EXPERIMENT.PY — Modèle SQLAlchemy
# ═══════════════════════════════════════════════════
from sqlalchemy import Column, String, Float, Integer, JSON, DateTime, Text, ForeignKey
from datetime import datetime
import uuid
from app.database import Base

class Experiment(Base):
    __tablename__ = "experiments"

    id                 = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id            = Column(String, ForeignKey("users.id"), nullable=True)  # ← NOUVEAU
    dataset_name       = Column(String(255))
    target_column      = Column(String(100))
    task_type          = Column(String(20), default="classification")
    framework          = Column(String(20), default="flaml")
    status             = Column(String(20), default="pending")
    time_budget        = Column(Integer, default=120)
    n_rows             = Column(Integer)
    n_cols             = Column(Integer)
    best_model         = Column(String(100))
    f1_score           = Column(Float)
    accuracy           = Column(Float)
    auc_roc            = Column(Float)
    training_time      = Column(Float)
    best_config        = Column(JSON)
    feature_importance = Column(JSON)
    feature_names      = Column(JSON)
    dataset_path       = Column(Text)
    error_message      = Column(Text)
    created_at         = Column(DateTime, default=datetime.utcnow)
    completed_at       = Column(DateTime)

    def to_dict(self):
        return {
            "id"                : self.id,
            "user_id"           : self.user_id,           # ← NOUVEAU
            "dataset_name"      : self.dataset_name,
            "target_column"     : self.target_column,
            "task_type"         : self.task_type,
            "framework"         : self.framework,
            "status"            : self.status,
            "time_budget"       : self.time_budget,
            "n_rows"            : self.n_rows,
            "n_cols"            : self.n_cols,
            "best_model"        : self.best_model,
            "f1_score"          : self.f1_score,
            "accuracy"          : self.accuracy,
            "auc_roc"           : self.auc_roc,
            "training_time"     : self.training_time,
            "best_config"       : self.best_config,
            "feature_importance": self.feature_importance,
            "feature_names"     : self.feature_names,
            "created_at"        : str(self.created_at),
            "completed_at"      : str(self.completed_at),
        }