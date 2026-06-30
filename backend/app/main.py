import random
import pandas as pd
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from .db import init_db, get_db, Flare
from .schemas import LiveDataPoint, FlareOut, PredictionResponse

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
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Mock data file not found")
    df = pd.read_csv(DATA_PATH)
    df = df.tail(limit)
    return df.to_dict(orient="records")


@app.get("/api/flare_catalog", response_model=list[FlareOut])
def get_flare_catalog(db: Session = Depends(get_db)):
    flares = db.query(Flare).order_by(Flare.start_time.desc()).all()
    return flares


@app.post("/api/predict", response_model=PredictionResponse)
def predict():
    # TODO: replace with real model + preprocess_pipeline() from Member 1
    probability = round(random.uniform(0, 1), 3)
    return PredictionResponse(
        status="success",
        flare_probability=probability,
        lead_time_mins=round(random.uniform(5, 30), 1),
        nowcast_active=probability > 0.7,
    )