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
    """Pull the most recent rows and derive a nowcast signal from her
    real flare_candidate flag, until a trained model exists."""
    df = load_real_data()
    if df is None or df.empty:
        return {"nowcast_active": False, "flare_probability": 0.0, "source": "no_data"}

    recent = load_full_recent_window()  # see helper below
    if recent.empty:
        return {"nowcast_active": False, "flare_probability": 0.0, "source": "no_data"}

    active = bool(recent["flare_candidate"].max())
    probability = round(float(recent["flare_candidate"].mean()), 3)
    peak_value = float(recent["COUNTS"].max())
    triggered_count = int(recent["flare_candidate"].sum())

    return {
        "nowcast_active": active,
        "flare_probability": probability,
        "source": "rule_based_flare_candidate",
        "peak_counts_in_window": round(peak_value, 1),
        "triggered_rows_in_window": triggered_count,
        "window_size": len(recent),
    }


def load_full_recent_window(window_rows: int = 60) -> "pd.DataFrame":
    """Loads the last N rows directly from the source columns needed
    for nowcast scoring (kept separate from load_real_data's renamed
    output so we always have COUNTS/flare_candidate available)."""
    if not REAL_DATA_PATH.exists():
        return pd.DataFrame()
    df = pd.read_csv(REAL_DATA_PATH, usecols=["DATETIME", "COUNTS", "flare_candidate"])
    return df.tail(window_rows)