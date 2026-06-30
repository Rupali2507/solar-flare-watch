import random
import pandas as pd
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .model_handler import run_inference

from .db import init_db, get_db, Flare
from .schemas import LiveDataPoint, FlareOut, PredictionResponse
from .real_data_loader import load_real_data, get_latest_nowcast_signal


app = FastAPI(title="Solar Flare Nowcasting API")

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "mock_live_feed.csv"


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def root():
    return {"message": "Solar Flare Watch API is running"}


@app.get("/api/live_data", response_model=list[LiveDataPoint])
def get_live_data(limit: int = 100):
    real_df = load_real_data()
    if real_df is not None:
        recent = real_df.tail(limit)
        return recent[["timestamp", "solexs_flux", "hel1os_flux"]].to_dict(orient="records")

    # fallback to mock CSV if real data isn't present
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="No live data available")
    df = pd.read_csv(DATA_PATH)
    df = df.tail(limit)
    return df.to_dict(orient="records")


@app.post("/api/predict", response_model=PredictionResponse)
def predict():
    result = run_inference()

    if not result.get("flare_probability") and not result.get("nowcast_active"):
        probability = round(random.uniform(0, 1), 3)
        return PredictionResponse(
            status="success",
            flare_probability=probability,
            lead_time_mins=round(random.uniform(5, 30), 1),
            nowcast_active=probability > 0.7,
            source="mock_random",
        )

    return PredictionResponse(
        status="success",
        flare_probability=result["flare_probability"],
        lead_time_mins=result["lead_time_mins"],
        nowcast_active=result["nowcast_active"],
        source=result["source"],
        peak_counts_in_window=result.get("peak_counts_in_window"),
        triggered_rows_in_window=result.get("triggered_rows_in_window"),
    )

@app.get("/api/flare_catalog", response_model=list[FlareOut])
def get_flare_catalog(db: Session = Depends(get_db)):
    flares = db.query(Flare).order_by(Flare.start_time.desc()).all()
    return flares


