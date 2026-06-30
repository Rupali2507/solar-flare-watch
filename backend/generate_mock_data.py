import pandas as pd
import numpy as np
from datetime import datetime, timedelta

n = 500
start = datetime(2026, 6, 30, 0, 0, 0)
timestamps = [start + timedelta(seconds=10*i) for i in range(n)]

rng = np.random.default_rng(42)
base_solexs = 50 + rng.normal(0, 3, n)
base_hel1os = 80 + rng.normal(0, 5, n)

flare = np.zeros(n)
flare[250:320] = np.concatenate([
    np.linspace(0, 400, 40),
    np.linspace(400, 0, 30)
])

solexs_flux = base_solexs + flare * 0.6
hel1os_flux = base_hel1os + flare

df = pd.DataFrame({
    "timestamp": [t.isoformat() for t in timestamps],
    "solexs_flux": solexs_flux.round(2),
    "hel1os_flux": hel1os_flux.round(2),
})
df.to_csv("data/mock_live_feed.csv", index=False)
print("done")
