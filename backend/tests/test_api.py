# ═══════════════════════════════════════════════════
# TESTS/TEST_API.PY — Tests unitaires FastAPI
# ═══════════════════════════════════════════════════
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.auth import get_current_user

# ── Simuler un utilisateur connecté sans valider de vrai JWT ────────────────
class FakeUser:
    id              = "test-user-id-123"
    nom_complet     = "Test User"
    nom_entreprise  = "Test PME"
    email           = "test@test.com"
    pays            = "Cameroun"
    secteur         = "Santé"
    created_at      = None
    last_login      = None

    def to_dict(self):
        return {
            "id"            : self.id,
            "nom_complet"   : self.nom_complet,
            "nom_entreprise": self.nom_entreprise,
            "email"         : self.email,
            "pays"          : self.pays,
            "secteur"       : self.secteur,
            "created_at"    : None,
            "last_login"    : None,
        }

# Surcharge de la dépendance — toutes les routes protégées recevront FakeUser
app.dependency_overrides[get_current_user] = lambda: FakeUser()

client = TestClient(app)

# ── Test 1 : Health check ─────────────────────────────────────────────────
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

# ── Test 2 : Route racine ─────────────────────────────────────────────────
def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "AutoML Platform API" in response.json()["message"]

# ── Test 3 : Upload CSV valide ────────────────────────────────────────────
def test_upload_valid_csv():
    csv_content = b"age,income,target\n25,50000,1\n30,60000,0\n35,70000,1"
    response = client.post(
        "/api/upload",
        files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "dataset_id" in data
    assert data["profile"]["rows"] == 3
    assert data["profile"]["cols"] == 3

# ── Test 4 : Upload fichier non-CSV ──────────────────────────────────────
def test_upload_invalid_format():
    response = client.post(
        "/api/upload",
        files={"file": ("test.xlsx", io.BytesIO(b"fake"), "application/vnd.ms-excel")}
    )
    assert response.status_code == 400

# ── Test 5 : Liste des expériences ───────────────────────────────────────
def test_list_experiments():
    response = client.get("/api/experiments")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# ── Test 6 : Résultat inexistant ──────────────────────────────────────────
def test_get_nonexistent_result():
    response = client.get("/api/results/fake-id-123")
    assert response.status_code == 404

# ── Test 7 : Statut tâche inexistante ────────────────────────────────────
def test_status_unknown_task():
    response = client.get("/api/status/unknown-task-id")
    assert response.status_code == 200
    assert response.json()["status"] == "pending"

# ── Test 8 : Summary des expériences ─────────────────────────────────────
def test_experiments_summary():
    response = client.get("/api/experiments/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "done" in data