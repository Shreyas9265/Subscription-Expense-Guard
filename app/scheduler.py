from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.database import SessionLocal
from app import crud

_scheduler = None

def start_scheduler():
    global _scheduler
    if _scheduler:
        return _scheduler
    sched = BackgroundScheduler(timezone="UTC")
    # Recompute every 10 minutes
    def job():
        db = SessionLocal()
        try:
            crud.recompute_subscriptions(db)
            crud.recompute_anomalies(db)
        finally:
            db.close()
    sched.add_job(job, IntervalTrigger(minutes=10), id="recompute_job", replace_existing=True)
    sched.start()
    _scheduler = sched
    return _scheduler
