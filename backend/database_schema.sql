CREATE TABLE IF NOT EXISTS flares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time DATETIME NOT NULL,
    peak_time DATETIME,
    end_time DATETIME,
    flare_class TEXT,
    probability REAL NOT NULL,
    lead_time_mins REAL
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    level TEXT NOT NULL,
    message TEXT NOT NULL
);