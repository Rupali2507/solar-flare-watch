import pandas as pd
from pathlib import Path

REAL_DATA_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "aligned_dataset.csv"
)
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

    df = pd.read_parquet(REAL_DATA_PATH)

    df = df.loc[
        :,
        [
            "DATETIME",
            "COUNTS",
            "flare_candidate",
            "is_peak",
            "peak_prominence",
        ]
    ]
    df = df.rename(columns=COLUMN_MAP)

    df["timestamp"] = (
        pd.to_datetime(df["timestamp"])
        .dt.strftime("%Y-%m-%d %H:%M:%S")
    )

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


def load_full_recent_window(window_rows: int = 60):
    if not REAL_DATA_PATH.exists():
        return pd.DataFrame()

    df = pd.read_parquet(REAL_DATA_PATH)

    return df.tail(window_rows)