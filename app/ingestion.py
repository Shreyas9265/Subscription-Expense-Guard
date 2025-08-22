# app/ingestion.py
import csv
from collections.abc import Iterable
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app import models, utils


def _pick(headers: list[str], *candidates: str):
    lower = {h.lower().strip(): h for h in headers}
    for c in candidates:
        if c in lower:
            return lower[c]
    return None


def parse_csv_to_transactions(file_path: str) -> Iterable[models.Transaction]:
    p = Path(file_path)
    if not p.exists():
        return []
    records = []
    with p.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = [h.lower().strip() for h in (reader.fieldnames or [])]

        date_col = _pick(headers, "date", "transaction_date", "posted_date")
        merchant_col = _pick(headers, "merchant", "description", "payee")
        amount_col = _pick(headers, "amount", "transaction_amount")
        category_col = _pick(headers, "category")
        currency_col = _pick(headers, "currency")

        for row in reader:
            try:
                raw_date = row[date_col]
                d = (
                    datetime.fromisoformat(raw_date).date()
                    if "-" in raw_date
                    else datetime.strptime(raw_date, "%m/%d/%Y").date()
                )
                m = (row[merchant_col] or "").strip()
                a = float(row[amount_col])
                cat = (row.get(category_col) or None) if category_col else None
                cur = (row.get(currency_col) or "USD") if currency_col else "USD"
            except Exception:
                continue

            nm = utils.normalize_merchant(m)
            records.append(
                models.Transaction(
                    date=d, merchant=m, amount=a, category=cat, currency=cur, normalized_merchant=nm
                )
            )
    return records


def ingest_transactions(db: Session, file_path: str) -> int:
    txns = list(parse_csv_to_transactions(file_path))
    if not txns:
        return 0
    db.add_all(txns)
    db.commit()
    return len(txns)
