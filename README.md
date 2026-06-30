# 🌞 Solar Flare Watch
## AI-Powered Solar Flare Nowcasting & 10-Minute Forecasting Platform

Solar Flare Watch is an end-to-end machine learning platform for **real-time solar flare nowcasting** and **short-term (10-minute) forecasting** using X-ray observations from **AstroSat SOLEXS**. The system continuously analyzes incoming solar X-ray light curves, engineers temporal and statistical features, and predicts the probability of an upcoming solar flare, providing an early warning system for space weather monitoring.

The platform combines **data engineering**, **feature engineering**, **machine learning**, and a **FastAPI backend** to deliver real-time predictions through REST APIs that can be integrated with dashboards, monitoring systems, and mission control applications.

---

# ✨ Features

- 🌞 Real-Time Solar Flare Nowcasting
- 🔮 10-Minute Solar Flare Forecasting
- 🤖 Random Forest based Prediction Model
- 📊 150+ Engineered Statistical & Temporal Features
- 📈 Live SOLEXS Light Curve Streaming
- ⚡ FastAPI REST API
- 📚 Interactive Swagger Documentation
- 🚀 Frontend Ready APIs
- 📡 Historical Flare Catalog
- 🛰 Mission Risk Tier Classification
- 📉 Confidence & Severity Estimation

---

# 🏗 System Architecture

```text
                    AstroSat SOLEXS Data
                             │
                             ▼
                  Data Cleaning & Alignment
                             │
                             ▼
                  Feature Engineering Pipeline
                             │
                             ▼
                Random Forest Prediction Model
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
   Real-Time Nowcasting               10-Minute Forecasting
         │                                       │
         └───────────────────┬───────────────────┘
                             ▼
                    FastAPI Backend API
                             │
          ┌──────────────────┴──────────────────┐
          ▼                                     ▼
     Swagger API                        Frontend Dashboard
```

---

# 📁 Repository Structure

```text
solar-flare-watch/

├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── model_handler.py
│   │   ├── real_data_loader.py
│   │   ├── schemas.py
│   │   ├── db.py
│   │   └── services/
│   │
│   ├── data/
│   │   ├── aligned_dataset.csv
│   │   ├── trained_forecast_model.pkl
│   │   └── mock_live_feed.csv
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   └── database_schema.sql
│
├── ml/
│   ├── notebooks/
│   ├── src/
│   ├── models/
│   ├── results/
│   └── data/
│
├── README.md
└── docker-compose.yml
```

---

# 🧠 Machine Learning Pipeline

```text
Raw SOLEXS X-Ray Data
          │
          ▼
 Data Cleaning & Alignment
          │
          ▼
  Feature Engineering
 (150+ Features)
          │
          ▼
 Forecast Dataset
          │
          ▼
 Random Forest Classifier
          │
          ▼
 Probability Prediction
          │
          ▼
 Severity Classification
          │
          ▼
 Nowcasting + Forecasting
```

---

# 📊 Feature Engineering

The prediction model uses over **150 engineered features** extracted from the solar X-ray light curve.

### Temporal Features

- Rolling Mean
- Rolling Standard Deviation
- Rolling Maximum
- Rolling Minimum
- Rolling Variance
- Exponential Moving Average (EMA)
- First & Second Order Difference
- Gradient
- Lag Features

### Statistical Features

- RMS
- Median
- Median Absolute Deviation (MAD)
- Z-Score
- Robust Z-Score
- Coefficient of Variation
- Rolling Skewness
- Rolling Kurtosis
- Window Energy
- Local Energy

### Peak Detection Features

- Peak Height
- Peak Width
- Peak Prominence
- Peak Rank
- Strong Peak Detection
- Integrated Counts
- Time Since Last Peak
- Rise Rate
- Decay Rate
- Peak Density

### Spectral Features

- Spectral Centroid
- Spectral Spread
- Spectral Entropy
- Hardness Ratios
- Energy Band Features

### Detector Features

- CZT Detector Statistics
- CdTe Detector Statistics
- Temperature Features
- High Voltage Monitoring
- Detector Count Statistics
- Sun Orientation Parameters

---

# 📈 Model Performance

The Random Forest classifier was trained for binary prediction of solar flare occurrence within the next **10 minutes**.

| Metric | Score |
|---------|-------:|
| Accuracy | **99.75%** |
| Precision | **95.76%** |
| Recall (TPR) | **100.00%** |
| F1 Score | **97.83%** |
| ROC-AUC | **0.99998** |
| False Positive Rate | **0.27%** |
| Specificity | **99.73%** |

---

# 🚀 REST API

## Health Check

```http
GET /
```

---

## Live Solar Data

```http
GET /api/live_data
```

Returns the latest SOLEXS observations.

---

## Solar Flare Prediction

```http
POST /api/predict
```

Example Response

```json
{
    "status": "success",
    "flare_probability": 0.003,
    "lead_time_mins": 10,
    "nowcast_active": false,
    "source": "Random Forest",
    "confidence": 99.67,
    "severity": "Low",
    "tier": "Safe",
    "peak_counts_in_window": 116,
    "triggered_rows_in_window": 1
}
```

---

## Historical Flare Catalog

```http
GET /api/flare_catalog
```

Returns previously detected flare events.

---

# 💻 Technology Stack

## Machine Learning

- Scikit-Learn
- NumPy
- Pandas
- Joblib

## Backend

- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

## Data Processing

- PyArrow
- SciPy

## Deployment

- Docker
- Hugging Face Spaces / Railway
- GitHub

---

# ⚙️ Local Setup

## Clone Repository

```bash
git clone https://github.com/<your-username>/solar-flare-watch.git

cd solar-flare-watch
```

---

## Backend

```bash
cd backend

python -m venv venv

source venv/bin/activate        # Linux/macOS

# or

venv\Scripts\activate           # Windows

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Open Swagger UI

```
http://127.0.0.1:8000/docs
```

---

## Machine Learning

```bash
cd ml

pip install -e .

jupyter notebook
```

---

# 📌 Current Status

- ✅ Data Collection & Processing
- ✅ Flare Event Detection
- ✅ Feature Engineering Pipeline
- ✅ Forecast Dataset Generation
- ✅ Random Forest Model Training
- ✅ Model Evaluation
- ✅ Model Serialization
- ✅ FastAPI Backend
- ✅ REST APIs
- ✅ Swagger Documentation
- ✅ Frontend Integration Ready
- ✅ Cloud Deployment
- ✅ Interactive Dashboard

---

# 🔮 Future Enhancements

- Multi-Class Flare Prediction (B, C, M & X Class)
- LSTM / Transformer based Forecasting
- Real-Time Streaming Pipeline
- Explainable AI using SHAP
- Alert & Notification System
- Satellite Mission Risk Dashboard
- Live Space Weather Analytics
- Historical Trend Analysis

---



# 📄 License

This project is licensed under the **MIT License**.

---

⭐ If you found this project useful, consider giving the repository a **star**.