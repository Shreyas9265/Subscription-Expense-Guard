from fastapi import FastAPI

from app.database import Base, engine
from app.routers import anomalies, subscriptions, transactions
from app.scheduler import start_scheduler
from app.settings import settings

app = FastAPI(title="Subscription Expense Guard", version="1.0.0")

# Create tables on startup (simple demo alternative to migrations)
Base.metadata.create_all(bind=engine)

app.include_router(transactions.router)
app.include_router(subscriptions.router)
app.include_router(anomalies.router)


@app.on_event("startup")
def startup():
    if settings.scheduler_enabled:
        start_scheduler()


@app.get("/healthz")
def health():
    return {"status": "ok"}
