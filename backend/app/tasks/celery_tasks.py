# ═══════════════════════════════════════════════════
# TASKS/CELERY_TASKS.PY — Tâches asynchrones Celery
# ═══════════════════════════════════════════════════
import os
import uuid
import pickle
import hashlib
import traceback
import pandas as pd
from datetime import datetime
from celery import Celery
from sklearn.model_selection import GroupShuffleSplit

REDIS_URL  = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
celery_app = Celery("automl", broker=REDIS_URL, backend=REDIS_URL)

celery_app.conf.update(
    task_serializer   = 'json',
    result_serializer = 'json',
    accept_content    = ['json'],
    timezone          = 'UTC',
)

MODELS_DIR = os.path.join(
    os.path.dirname(__file__), '..', '..', '..', 'models'
)
os.makedirs(MODELS_DIR, exist_ok=True)

@celery_app.task(bind=True, name='run_automl_task')
def run_automl_task(self, config: dict):
    from app.database import SessionLocal
    from app.models.user import User              # ← CORRECTION : importer User en premier
    from app.models.experiment import Experiment  # ← après User pour résoudre la FK
    from app.core.preprocessor import AutoPreprocessor
    from app.core.automl_engine import AutoMLEngine, OptunaEngine

    experiment_id = config.get('experiment_id', str(uuid.uuid4()))
    framework     = config.get('framework', 'flaml').lower()
    db            = SessionLocal()

    try:
        # Etape 1 — Chargement
        self.update_state(state='PROGRESS',
            meta={'step': 'Chargement des donnees', 'pct': 10,
                  'experiment_id': experiment_id})

        df         = pd.read_csv(config['dataset_path'])
        target_col = config['target_column']

        if target_col not in df.columns:
            raise ValueError(
                f"Colonne cible '{target_col}' introuvable. "
                f"Colonnes disponibles : {df.columns.tolist()}"
            )

        X = df.drop(target_col, axis=1)
        y = df[target_col]

        # Etape 2 — Preprocessing
        self.update_state(state='PROGRESS',
            meta={'step': 'Preprocessing automatique', 'pct': 25,
                  'experiment_id': experiment_id})

        preprocessor = AutoPreprocessor()
        X_processed  = preprocessor.fit_transform(X)

        # Split par groupes pour éviter la fuite de données
        row_hashes = X_processed.apply(
            lambda row: hashlib.md5(row.values.tobytes()).hexdigest(), axis=1
        )

        splitter = GroupShuffleSplit(test_size=0.2, n_splits=1, random_state=42)
        train_idx, test_idx = next(
            splitter.split(X_processed, y, groups=row_hashes)
        )

        X_train, X_test = X_processed.iloc[train_idx], X_processed.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        # Etape 3 — Entrainement (FLAML ou Optuna)
        step_label = 'Optimisation AutoML FLAML...' if framework == 'flaml' \
                     else 'Optimisation AutoML Optuna...'

        self.update_state(state='PROGRESS',
            meta={'step': step_label, 'pct': 40,
                  'experiment_id': experiment_id})

        print(f"=== Lancement {framework.upper()} ===")
        print(f"=== Train : {len(X_train)} lignes — Test : {len(X_test)} lignes ===")

        if framework == 'optuna':
            engine = OptunaEngine(
                task        = config.get('task_type', 'classification'),
                time_budget = config.get('time_budget', 120)
            )
        else:
            engine = AutoMLEngine(
                task        = config.get('task_type', 'classification'),
                time_budget = config.get('time_budget', 120)
            )

        engine.fit(X_train, y_train)
        metrics = engine.evaluate(X_test, y_test)

        print(f"=== {framework.upper()} terminé — métriques : {metrics} ===")

        # Etape 4 — SHAP
        self.update_state(state='PROGRESS',
            meta={'step': 'Generation des explications SHAP', 'pct': 85,
                  'experiment_id': experiment_id})

        feature_importance = engine.get_feature_importance(X_test)

        # Etape 5 — Sauvegarde du modèle
        self.update_state(state='PROGRESS',
            meta={'step': 'Sauvegarde du modele', 'pct': 92,
                  'experiment_id': experiment_id})

        model_path = os.path.join(MODELS_DIR, f"{experiment_id}_model.pkl")
        with open(model_path, 'wb') as f:
            if framework == 'optuna':
                pickle.dump(engine.best_model, f)
            else:
                pickle.dump(engine.automl, f)

        # Etape 6 — Mise à jour base de données
        self.update_state(state='PROGRESS',
            meta={'step': 'Sauvegarde des resultats', 'pct': 97,
                  'experiment_id': experiment_id})

        exp = db.query(Experiment)\
                .filter(Experiment.id == experiment_id).first()
        if exp:
            exp.status             = 'done'
            exp.n_rows             = int(df.shape[0])
            exp.n_cols             = int(df.shape[1])
            exp.best_model         = metrics.get('best_estimator')
            exp.f1_score           = metrics.get('f1_score')
            exp.accuracy           = metrics.get('accuracy')
            exp.auc_roc            = metrics.get('auc_roc')
            exp.training_time      = metrics.get('training_time')
            exp.best_config        = metrics.get('best_config')
            exp.feature_importance = feature_importance
            exp.feature_names      = X.columns.tolist()
            exp.framework          = framework
            exp.completed_at       = datetime.utcnow()
            db.commit()

        return {'status': 'done', 'experiment_id': experiment_id}

    except Exception as e:
        print("=== ERREUR TACHE CELERY ===")
        print(traceback.format_exc())
        print("===========================")

        error_msg = str(e)

        try:
            exp = db.query(Experiment)\
                    .filter(Experiment.id == experiment_id).first()
            if exp:
                exp.status        = 'failed'
                exp.error_message = error_msg
                db.commit()
        except Exception as db_err:
            print(f"Erreur DB : {db_err}")

        self.update_state(
            state='FAILURE',
            meta={
                'error'      : error_msg,
                'exc_type'   : type(e).__name__,
                'exc_message': error_msg,
            }
        )
        return {'status': 'failed', 'error': error_msg}

    finally:
        db.close()