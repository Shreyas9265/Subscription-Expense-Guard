"""Stateless analysis: detect subscriptions and anomalies in a CSV without the database.

Serverless instances don't share memory, so the web dashboard asks for a complete analysis in one
request instead of uploading to one instance and reading results back from another.
"""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from app import models, utils
from app.ingestion import parse_csv_to_transactions

SAMPLE_CSV = Path(__file__).resolve().parent / "sample_data" / "demo_transactions.csv"


def _txn(t: models.Transaction) -> dict:
    return {
        "id": t.id,
        "date": t.date.isoformat(),
        "merchant": t.merchant,
        "amount": round(abs(t.amount), 2),
        "category": t.category,
        "currency": t.currency or "USD",
        "normalized_merchant": t.normalized_merchant,
    }


def analyze_transactions(txns: list[models.Transaction]) -> dict:
    """Detect subscriptions and anomalies with the same rules the API uses, returning plain JSON."""
    txns = sorted(txns, key=lambda t: (t.date, t.merchant))
    for i, t in enumerate(txns, start=1):
        t.id = i

    by_merchant: dict[str, list[models.Transaction]] = defaultdict(list)
    for t in txns:
        if t.normalized_merchant:
            by_merchant[t.normalized_merchant].append(t)

    subscriptions, anomalies = [], []
    for nm, group in by_merchant.items():
        sub = utils.detect_subscription(nm, group)
        if sub:
            subscriptions.append(
                {
                    "normalized_merchant": sub.normalized_merchant,
                    "merchant": group[-1].merchant,
                    "category": group[-1].category,
                    "cadence": sub.cadence,
                    "avg_amount": sub.avg_amount,
                    "last_amount": round(abs(group[-1].amount), 2),
                    "charges": len(group),
                    "last_charge": sub.last_charge.isoformat(),
                    "next_charge": sub.next_charge.isoformat(),
                }
            )
        for a in utils.detect_anomalies(group):
            t = next(x for x in group if x.id == a.transaction_id)
            anomalies.append({"type": a.type, "message": a.message, "transaction": _txn(t)})

    subscriptions.sort(key=lambda s: s["next_charge"])
    anomalies.sort(key=lambda a: a["transaction"]["date"], reverse=True)
    return {
        "transactions": [_txn(t) for t in txns],
        "subscriptions": subscriptions,
        "anomalies": anomalies,
    }


def analyze_csv(path: str | Path) -> dict:
    return analyze_transactions(list(parse_csv_to_transactions(str(path))))
