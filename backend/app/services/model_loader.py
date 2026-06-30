from pathlib import Path
import joblib

MODEL_PATH = (
    Path(__file__)
    .resolve()
    .parents[3]
    / "ml"
    / "models"
    / "solar_flare_forecaster.pkl"
)

model = joblib.load(MODEL_PATH)