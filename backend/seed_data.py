from datetime import datetime, timedelta
from app.db import SessionLocal, init_db, Flare, Alert

init_db()
db = SessionLocal()

# clear existing rows so re-running this script doesn't duplicate
db.query(Flare).delete()
db.query(Alert).delete()
db.commit()

base = datetime(2026, 6, 30, 0, 0, 0)

flares = [
    Flare(
        start_time=base + timedelta(minutes=40),
        peak_time=base + timedelta(minutes=46),
        end_time=base + timedelta(minutes=52),
        flare_class="C",
        probability=0.34,
        lead_time_mins=12.0,
    ),
    Flare(
        start_time=base + timedelta(hours=2, minutes=10),
        peak_time=base + timedelta(hours=2, minutes=18),
        end_time=base + timedelta(hours=2, minutes=25),
        flare_class="M",
        probability=0.78,
        lead_time_mins=19.5,
    ),
    Flare(
        start_time=base + timedelta(hours=5, minutes=5),
        peak_time=base + timedelta(hours=5, minutes=9),
        end_time=base + timedelta(hours=5, minutes=14),
        flare_class="X",
        probability=0.93,
        lead_time_mins=27.0,
    ),
]

alerts = [
    Alert(timestamp=base + timedelta(minutes=39), level="yellow", message="Precursor activity detected"),
    Alert(timestamp=base + timedelta(hours=2, minutes=9), level="red", message="M-class flare nowcast active"),
    Alert(timestamp=base + timedelta(hours=5, minutes=4), level="red", message="X-class flare nowcast active"),
]

db.add_all(flares)
db.add_all(alerts)
db.commit()
db.close()

print("Seeded flares.db with 3 flares and 3 alerts")