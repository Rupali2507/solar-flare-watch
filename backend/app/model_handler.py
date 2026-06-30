"""
Single integration point for the trained forecasting model.

Until Member 1 hands off a trained model + preprocess_pipeline(), this
falls back to the existing rule-based flare_candidate signal. Once the
model file exists, drop it in MODEL_PATH and this module handles the rest
without main.py needing to change.
"""
import pickle
from pathlib import Path
from typing import Optional

import pandas as pd

from .real_data_loader import get_latest_nowcast_signal, load_full_recent_window

MODEL_PATH = Path(__file__).resolve().parent.parent / "data" / "trained_forecast_model.pkl"

_model = None  # cached after first load
_model_load_attempted = False


def load_model():
    """Load the trained model once and cache it. Returns None if no
    model file is present yet (expected during development)."""
    global _model, _model_load_attempted

    if _model_load_attempted:
        return _model

    _model_load_attempted = True

    if not MODEL_PATH.exists():
        print(f"[model_handler] No model found at {MODEL_PATH} — using rule-based fallback.")
        return None

    try:
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
        print(f"[model_handler] Loaded trained model from {MODEL_PATH}")
    except Exception as e:
        print(f"[model_handler] Failed to load model: {e} — using rule-based fallback.")
        _model = None

    return _model


def preprocess_pipeline(raw_data: pd.DataFrame) -> pd.DataFrame:
    """
    PLACEHOLDER — replace this with Member 1's actual preprocess_pipeline()
    once handed off. For now it just passes data through unchanged, since
    the rule-based fallback doesn't need feature engineering.
    """
    return raw_data


def run_inference() -> dict:
    """
    Main entry point called by /api/predict. Tries the real model first;
    falls back to the rule-based flare_candidate signal if no model is
    loaded yet.
    """
    model = load_model()

    if model is None:
        # --- fallback path: current rule-based logic ---
        signal = get_latest_nowcast_signal()
        return {
            "flare_probability": signal.get("flare_probability", 0.0),
            "lead_time_mins": 0.0,  # no predictive lead time without a real model
            "nowcast_active": signal.get("nowcast_active", False),
            "source": signal.get("source", "rule_based_flare_candidate"),
            "peak_counts_in_window": signal.get("peak_counts_in_window"),
            "triggered_rows_in_window": signal.get("triggered_rows_in_window"),
        }

    # --- real model path (fill in once handoff happens) ---
    raw_window = load_full_recent_window()
    features = preprocess_pipeline(raw_window)

    # TODO: confirm exact predict() call shape once Member 1 specifies it —
    # likely model.predict_proba(features) for sklearn/LightGBM, or a custom
    # forward pass for a PyTorch LSTM. Update once known.
    probability = float(model.predict_proba(features)[-1][1])

    return {
        "flare_probability": round(probability, 3),
        "lead_time_mins": 0.0,  # TODO: update once model also predicts lead time
        "nowcast_active": probability > 0.7,
        "source": "trained_model",
        "peak_counts_in_window": None,
        "triggered_rows_in_window": None,
    }