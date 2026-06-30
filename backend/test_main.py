"""
Basic smoke tests for the FastAPI backend. Run with: pytest test_main.py -v
These check that endpoints respond, return the right shape, and don't 500 —
not exhaustive correctness tests, just a safety net against breaking changes.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_live_data_returns_list():
    response = client.get("/api/live_data?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 5


def test_live_data_has_expected_fields():
    response = client.get("/api/live_data?limit=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    row = data[0]
    assert "timestamp" in row
    assert "solexs_flux" in row
    assert "hel1os_flux" in row
    assert isinstance(row["solexs_flux"], (int, float))


def test_flare_catalog_returns_list():
    response = client.get("/api/flare_catalog")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_flare_catalog_has_expected_fields():
    response = client.get("/api/flare_catalog")
    data = response.json()
    if data:  # only check shape if catalog isn't empty
        flare = data[0]
        assert "id" in flare
        assert "start_time" in flare
        assert "flare_class" in flare
        assert flare["flare_class"] in ("C", "M", "X")
        assert 0.0 <= flare["probability"] <= 1.0


def test_predict_returns_valid_shape():
    response = client.post("/api/predict")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert 0.0 <= data["flare_probability"] <= 1.0
    assert isinstance(data["nowcast_active"], bool)
    assert isinstance(data["lead_time_mins"], (int, float))


def test_predict_uses_rule_based_source_when_no_model():
    """Until a trained model is dropped into data/, /api/predict should
    fall back to the rule-based flare_candidate signal."""
    response = client.post("/api/predict")
    data = response.json()
    assert data["source"] in ("rule_based_flare_candidate", "mock_random", "trained_model")