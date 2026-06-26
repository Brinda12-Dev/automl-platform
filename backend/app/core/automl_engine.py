# ═══════════════════════════════════════════════════
# CORE/AUTOML_ENGINE.PY — Moteurs AutoML : FLAML + Optuna
# ═══════════════════════════════════════════════════
import time
import numpy as np
import pandas as pd
from sklearn.metrics import f1_score, accuracy_score, roc_auc_score
from sklearn.preprocessing import LabelEncoder

# ───────────────────────────────────────────────────
# MOTEUR FLAML
# ───────────────────────────────────────────────────
class AutoMLEngine:
    def __init__(self, task='classification', time_budget=120):
        self.task        = task
        self.time_budget = time_budget
        self.results     = {}
        self.trained     = False
        from flaml import AutoML
        self.automl = AutoML()

    def fit(self, X_train, y_train):
        print(f"Lancement FLAML — budget : {self.time_budget}s ...")
        start = time.time()

        self.n_classes     = y_train.nunique()
        self.is_multiclass = self.n_classes > 2

        self.automl.fit(
            X_train, y_train,
            task           = self.task,
            time_budget    = self.time_budget,
            metric         = 'f1' if not self.is_multiclass else 'macro_f1',
            estimator_list = ['xgboost','lgbm','rf','catboost','extra_tree','lrl1'],
            seed           = 42,
            verbose        = 0
        )
        self.results['training_time']  = round(time.time() - start, 2)
        self.results['best_estimator'] = self.automl.best_estimator
        self.results['best_config']    = {
            k: float(v) if hasattr(v, 'item') else v
            for k, v in self.automl.best_config.items()
        }
        self.trained = True
        print(f"Meilleur modele FLAML : {self.automl.best_estimator}")
        return self

    def predict(self, X):
        return self.automl.predict(X)

    def predict_proba(self, X):
        return self.automl.predict_proba(X)

    def evaluate(self, X_test, y_test):
        if not self.trained:
            raise Exception("Appelez fit() avant evaluate()")
        preds = self.predict(X_test)
        self.results['accuracy'] = round(accuracy_score(y_test, preds), 4)
        self.results['f1_score'] = round(f1_score(y_test, preds, average='weighted'), 4)

        if not self.is_multiclass:
            try:
                proba = self.predict_proba(X_test)[:, 1]
                self.results['auc_roc'] = round(roc_auc_score(y_test, proba), 4)
            except:
                self.results['auc_roc'] = None
        else:
            try:
                proba = self.predict_proba(X_test)
                self.results['auc_roc'] = round(
                    roc_auc_score(y_test, proba, multi_class='ovr', average='weighted'), 4
                )
            except:
                self.results['auc_roc'] = None

        return self.results

    def get_feature_importance(self, X_test):
        try:
            import shap
            model     = self.automl.model.estimator
            explainer = shap.TreeExplainer(model)
            shap_vals = explainer.shap_values(X_test)

            if isinstance(shap_vals, list):
                shap_matrix = np.mean([np.abs(sv) for sv in shap_vals], axis=0)
            else:
                shap_matrix = np.abs(shap_vals)

            if shap_matrix.ndim == 3:
                shap_matrix = shap_matrix.mean(axis=2)

            importance = pd.DataFrame({
                'feature'   : X_test.columns.tolist(),
                'importance': shap_matrix.mean(axis=0).tolist()
            }).sort_values('importance', ascending=False)
            return importance.head(15).to_dict('records')
        except Exception as e:
            print(f"SHAP ignore : {e}")
            return []


# ───────────────────────────────────────────────────
# MOTEUR OPTUNA
# ───────────────────────────────────────────────────
class OptunaEngine:
    def __init__(self, task='classification', time_budget=120):
        self.task          = task
        self.time_budget   = time_budget
        self.results       = {}
        self.trained       = False
        self.best_model    = None
        self.best_name     = None
        self.label_encoder = None  # ← NOUVEAU

    def fit(self, X_train, y_train):
        import optuna
        from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
        from xgboost import XGBClassifier
        from lightgbm import LGBMClassifier
        from sklearn.model_selection import cross_val_score

        optuna.logging.set_verbosity(optuna.logging.WARNING)
        print(f"Lancement Optuna — budget : {self.time_budget}s ...")
        start    = time.time()
        deadline = start + self.time_budget

        # ← NOUVEAU : encoder la cible si elle est textuelle
        # (ex: Crop Recommendation avec 'apple', 'banana', 'rice'...)
        if y_train.dtype == object or str(y_train.dtype) == 'category':
            self.label_encoder = LabelEncoder()
            y_train = pd.Series(
                self.label_encoder.fit_transform(y_train),
                index=y_train.index
            )

        self.n_classes     = y_train.nunique()
        self.is_multiclass = self.n_classes > 2
        scoring_metric     = 'f1_weighted'

        def objective(trial):
            algo = trial.suggest_categorical('algo', ['rf', 'extra_tree', 'xgboost', 'lgbm'])
            if algo == 'rf':
                model = RandomForestClassifier(
                    n_estimators = trial.suggest_int('n_estimators', 50, 300),
                    max_depth    = trial.suggest_int('max_depth', 3, 15),
                    random_state = 42, n_jobs=-1
                )
            elif algo == 'extra_tree':
                model = ExtraTreesClassifier(
                    n_estimators = trial.suggest_int('n_estimators', 50, 300),
                    max_depth    = trial.suggest_int('max_depth', 3, 15),
                    random_state = 42, n_jobs=-1
                )
            elif algo == 'xgboost':
                xgb_params = dict(
                    n_estimators  = trial.suggest_int('n_estimators', 50, 300),
                    max_depth     = trial.suggest_int('max_depth', 3, 10),
                    learning_rate = trial.suggest_float('learning_rate', 0.01, 0.3),
                    random_state  = 42, verbosity=0
                )
                xgb_params['eval_metric'] = 'mlogloss' if self.is_multiclass else 'logloss'
                model = XGBClassifier(**xgb_params)
            else:
                model = LGBMClassifier(
                    n_estimators  = trial.suggest_int('n_estimators', 50, 300),
                    max_depth     = trial.suggest_int('max_depth', 3, 10),
                    learning_rate = trial.suggest_float('learning_rate', 0.01, 0.3),
                    random_state  = 42, verbosity=-1
                )
            score = cross_val_score(
                model, X_train, y_train,
                cv=3, scoring=scoring_metric, n_jobs=-1
            ).mean()
            return score

        def timeout_callback(study, trial):
            if time.time() >= deadline:
                study.stop()

        study = optuna.create_study(
            direction = 'maximize',
            sampler   = optuna.samplers.TPESampler(seed=42),
            pruner    = optuna.pruners.MedianPruner()
        )
        study.optimize(objective, timeout=self.time_budget, callbacks=[timeout_callback])

        best = study.best_trial
        algo = best.params['algo']
        self.best_name = algo

        if algo == 'rf':
            self.best_model = RandomForestClassifier(
                n_estimators=best.params['n_estimators'],
                max_depth=best.params['max_depth'],
                random_state=42, n_jobs=-1
            )
        elif algo == 'extra_tree':
            self.best_model = ExtraTreesClassifier(
                n_estimators=best.params['n_estimators'],
                max_depth=best.params['max_depth'],
                random_state=42, n_jobs=-1
            )
        elif algo == 'xgboost':
            xgb_final = dict(
                n_estimators=best.params['n_estimators'],
                max_depth=best.params['max_depth'],
                learning_rate=best.params['learning_rate'],
                random_state=42, verbosity=0
            )
            xgb_final['eval_metric'] = 'mlogloss' if self.is_multiclass else 'logloss'
            self.best_model = XGBClassifier(**xgb_final)
        else:
            self.best_model = LGBMClassifier(
                n_estimators=best.params['n_estimators'],
                max_depth=best.params['max_depth'],
                learning_rate=best.params['learning_rate'],
                random_state=42, verbosity=-1
            )

        self.best_model.fit(X_train, y_train)
        self.results['training_time']  = round(time.time() - start, 2)
        self.results['best_estimator'] = self.best_name
        self.results['best_config']    = {
            k: float(v) if isinstance(v, float) else v
            for k, v in best.params.items()
        }
        self.trained = True
        print(f"Meilleur modele Optuna : {self.best_name}")
        return self

    def predict(self, X):
        preds = self.best_model.predict(X)
        # ← NOUVEAU : décoder si la cible était textuelle
        if self.label_encoder is not None:
            preds = self.label_encoder.inverse_transform(preds.astype(int))
        return preds

    def predict_proba(self, X):
        return self.best_model.predict_proba(X)

    def evaluate(self, X_test, y_test):
        if not self.trained:
            raise Exception("Appelez fit() avant evaluate()")
        preds = self.predict(X_test)
        self.results['accuracy'] = round(accuracy_score(y_test, preds), 4)
        self.results['f1_score'] = round(f1_score(y_test, preds, average='weighted'), 4)

        if not self.is_multiclass:
            try:
                proba = self.predict_proba(X_test)[:, 1]
                self.results['auc_roc'] = round(roc_auc_score(y_test, proba), 4)
            except:
                self.results['auc_roc'] = None
        else:
            try:
                proba = self.predict_proba(X_test)
                # ← y_test encodé pour AUC-ROC si label_encoder existe
                y_test_enc = y_test
                if self.label_encoder is not None:
                    y_test_enc = pd.Series(
                        self.label_encoder.transform(y_test),
                        index=y_test.index
                    )
                self.results['auc_roc'] = round(
                    roc_auc_score(y_test_enc, proba, multi_class='ovr', average='weighted'), 4
                )
            except:
                self.results['auc_roc'] = None

        return self.results

    def get_feature_importance(self, X_test):
        try:
            import shap
            explainer = shap.TreeExplainer(self.best_model)
            shap_vals = explainer.shap_values(X_test)

            if isinstance(shap_vals, list):
                shap_matrix = np.mean([np.abs(sv) for sv in shap_vals], axis=0)
            else:
                shap_matrix = np.abs(shap_vals)

            if shap_matrix.ndim == 3:
                shap_matrix = shap_matrix.mean(axis=2)

            importance = pd.DataFrame({
                'feature'   : X_test.columns.tolist(),
                'importance': shap_matrix.mean(axis=0).tolist()
            }).sort_values('importance', ascending=False)
            return importance.head(15).to_dict('records')
        except Exception as e:
            print(f"SHAP ignore : {e}")
            return []