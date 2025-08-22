from app.ingestion import parse_csv_to_transactions
import os

def test_parse_csv_minimal(tmp_path):
    p = tmp_path / "t.csv"
    p.write_text("date,merchant,amount\n2025-01-01,TestCo,9.99\n")
    txns = list(parse_csv_to_transactions(str(p)))
    assert len(txns) == 1
    assert txns[0].merchant == "TestCo"
