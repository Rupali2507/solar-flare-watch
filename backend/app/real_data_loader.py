import pandas as pd
from pathlib import Path

REAL_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "aligned_dataset.csv"

# Map her raw column names -> our API contract names.
# Update the right-hand side once she renames things on her end.
COLUMN_MAP = {
    "DATETIME": "timestamp",
    "COUNTS": "solexs_flux",   # single-detector counts standing in for solexs_flux for now
}


def load_real_data() -> pd.DataFrame | None:
    """Load and adapt the real aligned dataset if present. Returns None if unavailable."""
    if not REAL_DATA_PATH.exists():
        return None

    df = pd.read_csv(REAL_DATA_PATH, usecols=[
        "DATETIME", "COUNTS", "flare_candidate", "is_peak", "peak_prominence"
    ])
    df = df.rename(columns=COLUMN_MAP)

    # hel1os_flux isn't in this file yet (spectral/2nd-detector data wasn't merged in) —
    # placeholder until she sends a true dual-sensor merge.
    df["hel1os_flux"] = df["solexs_flux"]

    return df


def get_latest_nowcast_signal() -> dict:
    """Pull the most recent rows and derive a crude live nowcast signal
    from her real flare_candidate flag, until a trained model exists."""
    df = load_real_data()
    if df is None or df.empty:
        return {"nowcast_active": False, "flare_probability": 0.0, "source": "no_data"}

    recent = df.tail(60)  # ~last minute at 1s cadence
    active = bool(recent["flare_candidate"].max())
    # crude probability proxy: fraction of recent rows flagged as flare candidates
    probability = round(float(recent["flare_candidate"].mean()), 3)

    return {
        "nowcast_active": active,
        "flare_probability": probability,
        "source": "rule_based_flare_candidate",
    }