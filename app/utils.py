from __future__ import annotations

import re
from datetime import timedelta
from statistics import mean

from app import models

MERCHANT_NORMALIZE = re.compile(r"[^a-z0-9]+")


def normalize_merchant(name: str) -> str:
    name = name.lower().strip()
    name = MERCHANT_NORMALIZE.sub(" ", name)
    name = re.sub(r"\binc\b|\bllc\b|\bltd\b|\bco\b", "", name)
    return re.sub(r"\s+", " ", name).strip()


def detect_subscription(nm: str, txns: list[models.Transaction]) -> models.Subscription | None:
    if len(txns) < 3:
        return None
    # Compute gaps between consecutive charges (in days)
    dates = [t.date for t in txns]
    gaps = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]
    if not gaps:
        return None
    avg_gap = mean(gaps)
    cadence = None
    if 26 <= avg_gap <= 33:
        cadence = "monthly"
    elif 6 <= avg_gap <= 8:
        cadence = "weekly"
    else:
        return None

    avg_amount = mean(abs(t.amount) for t in txns)
    last_charge = max(dates)
    next_charge = last_charge + timedelta(days=30 if cadence == "monthly" else 7)

    return models.Subscription(
        normalized_merchant=nm,
        cadence=cadence,
        avg_amount=round(avg_amount, 2),
        last_charge=last_charge,
        next_charge=next_charge,
    )


def detect_anomalies(txns: list[models.Transaction]) -> list[models.Anomaly]:
    anomalies: list[models.Anomaly] = []
    if len(txns) < 2:
        return anomalies
    amounts = [abs(t.amount) for t in txns]
    avg_amt = mean(amounts)

    # Flag price hikes > 25% over average
    for t in txns:
        if abs(t.amount) > 1.25 * avg_amt:
            anomalies.append(
                models.Anomaly(
                    transaction_id=t.id,
                    type="price_hike",
                    message=f"Charge {abs(t.amount):.2f} > 25% above average {avg_amt:.2f} for {t.normalized_merchant}.",
                )
            )

    # Duplicate same-day charges
    by_day = {}
    for t in txns:
        key = (t.date, round(abs(t.amount), 2))
        by_day.setdefault(key, []).append(t)
    for key, items in by_day.items():
        if len(items) > 1:
            for t in items:
                anomalies.append(
                    models.Anomaly(
                        transaction_id=t.id,
                        type="duplicate",
                        message=f"Possible duplicate: {len(items)} charges of {abs(t.amount):.2f} on {t.date}.",
                    )
                )
    return anomalies
