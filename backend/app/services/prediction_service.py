import pandas as pd

from backend.app.services.model_loader import model
from src.feature_engineering import engineer_lightcurve_features


def predict_flare(df: pd.DataFrame):

    features = engineer_lightcurve_features(df)

    probability = float(
        model.predict_proba(features)[0][1]
    )

    prediction = probability >= 0.5

    if probability >= 0.85:
        severity = "Extreme"
        tier = "Tier 3"

    elif probability >= 0.60:
        severity = "High"
        tier = "Tier 2"

    elif probability >= 0.30:
        severity = "Moderate"
        tier = "Tier 1"

    else:
        severity = "Low"
        tier = "Safe"

    return {

        "prediction": prediction,

        "probability": probability,

        "confidence": round(probability * 100, 2),

        "severity": severity,

        "tier": tier,

        "forecast_window": "10 minutes"

    }