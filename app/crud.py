from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, utils


def create_transactions(db: Session, txns: list[models.Transaction]):
    db.add_all(txns)
    db.commit()


def list_transactions(db: Session, limit: int = 100, offset: int = 0):
    stmt = (
        select(models.Transaction)
        .order_by(models.Transaction.date.desc())
        .limit(limit)
        .offset(offset)
    )
    return db.execute(stmt).scalars().all()


def recompute_subscriptions(db: Session):
    # Clear existing
    db.query(models.Subscription).delete()
    db.commit()

    # Detect subscriptions by normalized merchant
    # Get all merchants
    merchants = (
        db.execute(select(models.Transaction.normalized_merchant).distinct()).scalars().all()
    )
    for nm in merchants:
        if not nm:
            continue
        txns = (
            db.execute(
                select(models.Transaction)
                .where(models.Transaction.normalized_merchant == nm)
                .order_by(models.Transaction.date)
            )
            .scalars()
            .all()
        )
        sub = utils.detect_subscription(nm, txns)
        if sub:
            db.add(sub)
    db.commit()


def recompute_anomalies(db: Session):
    # Clear existing
    db.query(models.Anomaly).delete()
    db.commit()

    # Price hike detection vs average
    merchants = (
        db.execute(select(models.Transaction.normalized_merchant).distinct()).scalars().all()
    )
    for nm in merchants:
        if not nm:
            continue
        txns = (
            db.execute(
                select(models.Transaction)
                .where(models.Transaction.normalized_merchant == nm)
                .order_by(models.Transaction.date)
            )
            .scalars()
            .all()
        )
        anomalies = utils.detect_anomalies(txns)
        for a in anomalies:
            db.add(a)
    db.commit()


def list_subscriptions(db: Session):
    return (
        db.execute(select(models.Subscription).order_by(models.Subscription.next_charge))
        .scalars()
        .all()
    )


def list_anomalies(db: Session, limit: int = 100):
    return (
        db.execute(select(models.Anomaly).order_by(models.Anomaly.id.desc()).limit(limit))
        .scalars()
        .all()
    )
