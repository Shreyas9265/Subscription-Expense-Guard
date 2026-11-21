"""Vercel serverless entry point: a self-seeding live demo of Subscription Expense Guard."""

import os
from pathlib import Path

# Serverless: only /tmp is writable, and there is no long-running process for the scheduler.
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/sea.db")
os.environ.setdefault("SCHEDULER_ENABLED", "false")

from fastapi.responses import RedirectResponse  # noqa: E402

from app import crud, ingestion, models  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402  (creates the tables)

SAMPLE = Path(__file__).resolve().parent / "app" / "sample_data" / "transactions_sample.csv"

# On a cold start, seed the bundled sample transactions, then detect subscriptions/anomalies.
with SessionLocal() as db:
    if db.query(models.Transaction).count() == 0 and SAMPLE.exists():
        ingestion.ingest_transactions(db, str(SAMPLE))
        crud.recompute_subscriptions(db)
        crud.recompute_anomalies(db)


@app.get("/", include_in_schema=False)
def home():
    return RedirectResponse(url="/docs")
