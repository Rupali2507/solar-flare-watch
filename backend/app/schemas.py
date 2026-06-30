from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class LiveDataPoint(BaseModel):
    timestamp: str
    solexs_flux: float
    hel1os_flux: float


class FlareOut(BaseModel):
    id: int
    start_time: datetime
    peak_time: Optional[datetime]
    end_time: Optional[datetime]
    flare_class: Optional[str]
    probability: float
    lead_time_mins: Optional[float]

    class Config:
        from_attributes = True


class PredictionResponse(BaseModel):
    status: str
    flare_probability: float
    lead_time_mins: float
    nowcast_active: bool