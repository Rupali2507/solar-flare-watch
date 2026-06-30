from pathlib import Path

import joblib
import pandas as pd

from .real_data_loader import (
    get_latest_nowcast_signal,
    load_full_recent_window,
)

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "trained_forecast_model.pkl"
)

_model = None
_model_load_attempted = False


def load_model():
    global _model, _model_load_attempted

    if _model_load_attempted:
        return _model

    _model_load_attempted = True

    print("=" * 60)
    print("MODEL PATH :", MODEL_PATH)
    print("EXISTS     :", MODEL_PATH.exists())
    print("=" * 60)

    if not MODEL_PATH.exists():
        print("[model_handler] Model file not found.")
        return None

    try:
        _model = joblib.load(MODEL_PATH)
        print("[model_handler] Random Forest model loaded successfully.")
    except Exception as e:
        print("[model_handler] Failed to load model:", e)
        _model = None

    return _model


def preprocess_pipeline(df: pd.DataFrame, model):

    X = (
        df.drop(
            columns=[
                "DATETIME",
                "MJD",
                "ISOT",
                "flare_next_10min",
            ],
            errors="ignore",
        )
        .select_dtypes(include="number")
        .fillna(0)
    )

    # Keep only features used during training
    X = X.reindex(columns=model.feature_names_in_, fill_value=0)

    return X


def run_inference():

    model = load_model()

    # ---------------------------------------------------
    # Rule-based fallback
    # ---------------------------------------------------

    if model is None:

        signal = get_latest_nowcast_signal()

        return {
            "flare_probability": signal.get("flare_probability", 0.0),
            "lead_time_mins": 0,
            "nowcast_active": signal.get("nowcast_active", False),
            "severity": "Unknown",
            "tier": "Unknown",
            "confidence": 0,
            "source": signal.get(
                "source",
                "rule_based_flare_candidate",
            ),
            "peak_counts_in_window": signal.get(
                "peak_counts_in_window"
            ),
            "triggered_rows_in_window": signal.get(
                "triggered_rows_in_window"
            ),
        }

    # ---------------------------------------------------
    # ML Prediction
    # ---------------------------------------------------

    raw_window = load_full_recent_window()
    peak_counts = float(raw_window["COUNTS"].max())

    triggered_rows = int(raw_window["flare_candidate"].sum())

    if raw_window.empty:

        return {
            "flare_probability": 0,
            "lead_time_mins": 0,
            "nowcast_active": False,
            "severity": "Unknown",
            "tier": "Unknown",
            "confidence": 0,
            "source": "no_data",
        }

    features = preprocess_pipeline(raw_window, model)

    latest = features.tail(1)

    probability = float(
        model.predict_proba(latest)[0][1]
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
        "flare_probability": round(probability, 3),
        "lead_time_mins": 10,
        "nowcast_active": probability > 0.5,
        "source": "Random Forest",
        "confidence": round(max(probability, 1 - probability) * 100, 2),
        "severity": severity,
        "tier": tier,
        "peak_counts_in_window": peak_counts,
        "triggered_rows_in_window": triggered_rows,
    }