FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY app ./app
COPY data ./data

# Copy scripts
COPY detect_real_flares.py .
COPY database_schema.sql .
COPY seed_data.py .

# Expose API port
EXPOSE 8000

# Railway provides the PORT environment variable
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"