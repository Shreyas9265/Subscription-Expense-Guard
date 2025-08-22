from datetime import datetime
from typing import Iterable
import pandas as pd
from sqlalchemy.orm import Session
from app import models, utils

def parse_csv_to_transactions(file_path: str) -> Iterable[models.Transaction]:
    df = pd.read_csv(file_path)
    # Expected columns: date, merchant, amount, category (optional), currency (optional)
    # Try to be flexible with column names:
    colmap = {c.lower().strip(): c for c in df.columns}
    def pick(*names):
        for n in names:
            if n in colmap:
                return colmap[n]
        return None

    date_col = pick("date", "transaction_date", "posted_date")
    merchant_col = pick("merchant", "description", "payee")
    amount_col = pick("amount", "transaction_amount")
    category_col = pick("category")
    currency_col = pick("currency")

    records = []
    for _, row in df.iterrows():
        try:
            d = row[date_col]
            if isinstance(d, str):
                d = datetime.fromisoformat(d).date() if "-" in d else datetime.strptime(d, "%m/%d/%Y").date()
            m = str(row[merchant_col]).strip()
            a = float(row[amount_col])
            cat = str(row[category_col]).strip() if category_col and not pd.isna(row[category_col]) else None
            cur = str(row[currency_col]).strip() if currency_col and not pd.isna(row[currency_col]) else "USD"
        except Exception:
            continue
        nm = utils.normalize_merchant(m)
        records.append(models.Transaction(date=d, merchant=m, amount=a, category=cat, currency=cur, normalized_merchant=nm))
    return records

def ingest_transactions(db: Session, file_path: str) -> int:
    txns = list(parse_csv_to_transactions(file_path))
    if not txns:
        return 0
    db.add_all(txns)
    db.commit()
    return len(txns)
