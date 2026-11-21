# Subscription Expense Guard (SEA)

**🔴 Live dashboard:** https://subscription-expense-guard.vercel.app · **API docs:** https://subscription-expense-guard.vercel.app/docs · redeploy with `vercel/deploy.sh`

## Web dashboard (`web/`)

A React + TypeScript + Tailwind dashboard on top of the API: upload a bank-statement CSV (or use the
6-month synthetic sample) to see recurring cost per month, a 30-day charge forecast, price-hike and
duplicate-charge alerts, spending by category, and sortable subscription and transaction tables.

It calls `POST /analyze` (and `GET /analyze/sample`), a stateless endpoint that returns transactions,
subscriptions and anomalies in one response. Serverless instances don't share memory, so the dashboard
never depends on an earlier upload being stored. Both endpoints reuse the same detection rules as the
rest of the API.

```bash
cd web && npm install && npm run dev   # proxies /analyze to the live API (override with API_URL)
```


A production-style backend project for software engineering portfolios. SEA ingests bank/card CSVs, auto-detects **recurring subscriptions**, flags **price hikes / anomalies**, and **forecasts** next charges. Built with **FastAPI**, **SQLAlchemy**, and **APScheduler**; ships with tests, Docker, and CI.

## Features
- CSV ingestion for transactions
- Merchant normalization & subscription detection (monthly/weekly cadence)
- Price hike and duplicate-charge anomaly detection
- Forecast upcoming charges for subscriptions
- REST API with OpenAPI docs (Swagger UI)
- Background scheduler to refresh subscriptions/anomalies
- Works out-of-the-box with SQLite; Postgres optional
- Unit tests (pytest), Dockerfile, docker-compose, and GitHub Actions CI

## Quickstart (Local)
```bash
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Open http://127.0.0.1:8000/docs for the API.

### Ingest sample CSV
```bash
curl -X POST "http://127.0.0.1:8000/ingest/csv"   -F "file=@app/sample_data/transactions_sample.csv"
```
Then inspect:
- `GET /transactions`
- `GET /subscriptions`
- `GET /anomalies`
- `GET /forecast`

## Docker
```bash
docker build -t sea .
docker run -p 8000:8000 --env-file .env.example sea
```

## Docker Compose (with Postgres)
```bash
docker compose up --build
```
Compose starts Postgres and the app (configured via env).

## Configuration
- Copy `.env.example` to `.env` and adjust.
- Defaults use SQLite (no extra setup). For Postgres, set `DATABASE_URL` like:
  `postgresql+psycopg2://postgres:postgres@db:5432/sea`

## Tests
```bash
pytest -q
```

## Endpoints
- `POST /ingest/csv` — Upload CSV of transactions
- `GET /transactions` — List transactions
- `GET /subscriptions` — Detected recurring subscriptions
- `GET /anomalies` — Anomaly list (price hikes, duplicates)
- `GET /forecast` — Next expected charges

## Project Structure
```
subscription-expense-guard/
  app/
    main.py
    settings.py
    database.py
    models.py
    schemas.py
    crud.py
    ingestion.py
    scheduler.py
    utils.py
    routers/
      transactions.py
      subscriptions.py
      anomalies.py
    tests/
      test_ingestion.py
      test_api.py
    sample_data/
      transactions_sample.csv
  requirements.txt
  Dockerfile
  docker-compose.yml
  .env.example
  .github/workflows/ci.yml
  Makefile
  README.md
```
