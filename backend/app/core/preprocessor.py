# ═══════════════════════════════════════════════════
# CORE/PREPROCESSOR.PY — AutoPreprocessor
# ═══════════════════════════════════════════════════
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from feature_engine.encoding import OrdinalEncoder
from feature_engine.outliers import Winsorizer

class AutoPreprocessor:
    """
    Preprocessing automatique universel.
    Detecte les types de colonnes et applique
    les transformations adequates automatiquement.
    """
    def __init__(self):
        self.num_cols        = []
        self.cat_cols        = []
        self.binary_cols     = []
        self.continuous_cols = []
        self.fitted          = False

    def fit_transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = X.copy()

        # Detection des types
        self.num_cols        = X.select_dtypes(include=['number']).columns.tolist()
        self.cat_cols        = X.select_dtypes(include=['object','category']).columns.tolist()
        self.binary_cols     = [c for c in self.num_cols if X[c].nunique() <= 2]
        self.continuous_cols = [c for c in self.num_cols if X[c].nunique() > 2]

        # 1. Imputation numerique
        if self.num_cols:
            imputer = SimpleImputer(strategy='median')
            X[self.num_cols] = imputer.fit_transform(X[self.num_cols])

        # 2. Imputation categorielle
        if self.cat_cols:
            for col in self.cat_cols:
                X[col] = X[col].fillna(X[col].mode()[0])

        # 3. Encodage categoriel
        if self.cat_cols:
            encoder = OrdinalEncoder(
                encoding_method='arbitrary',
                variables=self.cat_cols
            )
            X = encoder.fit_transform(X)

        # 4. Traitement outliers (colonnes continues uniquement)
        if self.continuous_cols:
            try:
                winsorizer = Winsorizer(
                    variables=self.continuous_cols,
                    capping_method='iqr',
                    tail='both', fold=1.5
                )
                X = winsorizer.fit_transform(X)
            except Exception as e:
                print(f"Winsorizer ignore : {e}")

        self.fitted = True
        return X

    def get_info(self):
        return {
            "colonnes_numeriques"    : self.num_cols,
            "colonnes_binaires"      : self.binary_cols,
            "colonnes_continues"     : self.continuous_cols,
            "colonnes_categorielles" : self.cat_cols,
        }