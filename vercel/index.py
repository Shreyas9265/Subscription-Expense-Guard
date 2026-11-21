"""Vercel serverless entry point: the API behind the dashboard, seeded with demo data.

The React dashboard (web/) is built into public/ and served by Vercel's CDN at "/".
"""

import os
from pathlib import Path

# Serverless: only /tmp is writable, and there is no long-running process for the scheduler.
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/sea.db")
os.environ.setdefault("SCHEDULER_ENABLED", "false")

from app import crud, ingestion, models  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402  (creates the tables; Vercel serves this `app`)

SAMPLE = Path(__file__).resolve().parent / "app" / "sample_data" / "demo_transactions.csv"

# On a cold start, seed the bundled sample transactions, then detect subscriptions/anomalies.
with SessionLocal() as db:
    if db.query(models.Transaction).count() == 0 and SAMPLE.exists():
        ingestion.ingest_transactions(db, str(SAMPLE))
        crud.recompute_subscriptions(db)
        crud.recompute_anomalies(db)


__all__ = ["app"]
