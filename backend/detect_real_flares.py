"""
Scans the real Aditya-L1 dataset for flare_candidate clusters and inserts
them as discrete flare events into the database, replacing the dummy
seeded rows with genuine detections from real telemetry.
"""
import pandas as pd
from pathlib import Path
from app.db import SessionLocal, init_db, Flare, Alert

DATA_PATH = Path(__file__).resolve().parent / "data" / "aligned_dataset.csv"

# rows within this many seconds of each other are merged into one event
GAP_THRESHOLD_SECONDS = 90


def classify_flare(peak_counts: float) -> str:
    """Rough class assignment based on peak COUNTS — not a calibrated
    GOES-style classification, just a placeholder until the real model
    or a proper counts-to-class mapping is available."""
    if peak_counts >= 300:
        return "X"
    elif peak_counts >= 200:
        return "M"
    else:
        return "C"


def detect_events() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH, usecols=["DATETIME", "COUNTS", "flare_candidate"])
    df["DATETIME"] = pd.to_datetime(df["DATETIME"])

    candidates = df[df["flare_candidate"] == 1].reset_index(drop=True)
    if candidates.empty:
        return pd.DataFrame()

    gap_seconds = candidates["DATETIME"].diff().dt.total_seconds().fillna(9999)
    candidates["event_id"] = (gap_seconds > GAP_THRESHOLD_SECONDS).cumsum()

    events = candidates.groupby("event_id").agg(
        start_time=("DATETIME", "min"),
        end_time=("DATETIME", "max"),
        peak_counts=("COUNTS", "max"),
        n_rows=("COUNTS", "size"),
    ).reset_index(drop=True)

    # peak_time = the row where COUNTS actually hits its max within the event
    peak_times = []
    for _, row in events.iterrows():
        window = candidates[
            (candidates["DATETIME"] >= row["start_time"])
            & (candidates["DATETIME"] <= row["end_time"])
        ]
        peak_times.append(window.loc[window["COUNTS"].idxmax(), "DATETIME"])
    events["peak_time"] = peak_times

    events["flare_class"] = events["peak_counts"].apply(classify_flare)

    # crude probability proxy: how many candidate rows packed into the event
    # relative to the largest event in the dataset (just a placeholder, not
    # a calibrated probability — real value should come from the trained model)
    max_rows = events["n_rows"].max()
    events["probability"] = (events["n_rows"] / max_rows).round(3)

    return events


def main():
    init_db()
    events = detect_events()

    if events.empty:
        print("No flare_candidate rows found — nothing to insert.")
        return

    db = SessionLocal()
    db.query(Flare).delete()
    db.query(Alert).delete()
    db.commit()

    for _, row in events.iterrows():
        flare = Flare(
            start_time=row["start_time"],
            peak_time=row["peak_time"],
            end_time=row["end_time"],
            flare_class=row["flare_class"],
            probability=float(row["probability"]),
            lead_time_mins=None,  # no predictive lead time yet — nowcast only
        )
        db.add(flare)

        level = "red" if row["flare_class"] in ("M", "X") else "yellow"
        alert = Alert(
            timestamp=row["start_time"],
            level=level,
            message=f"{row['flare_class']}-class flare candidate detected "
                     f"(peak COUNTS={row['peak_counts']:.0f})",
        )
        db.add(alert)

    db.commit()
    db.close()
    print(f"Inserted {len(events)} real detected flare events into flares.db")


if __name__ == "__main__":
    main()