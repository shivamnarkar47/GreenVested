# ESG Scoring Platform

This directory contains the backend API for the ESG Scoring Platform.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create .env file:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Run the server:

**Development:**
```bash
uvicorn app.main:app --reload
```

**Production (Gunicorn):**
```bash
gunicorn --workers 1 --bind :8080 --timeout 600 --worker-class uvicorn.workers.UvicornWorker app:application
```

Or using config file:
```bash
gunicorn -c gunicorn.conf.py app:application
```

## API Documentation

Open http://localhost:8080/docs for Swagger UI.

## Database

The platform uses SQLite for local development.
For production, configure PostgreSQL in DATABASE_URL.
