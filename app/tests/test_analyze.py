from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_sample_analysis_finds_subscriptions_and_anomalies():
    r = client.get("/analyze/sample")
    assert r.status_code == 200
    body = r.json()
    merchants = {s["normalized_merchant"] for s in body["subscriptions"]}
    assert {"netflix com", "spotify usa", "hellofresh", "iron temple gym"} <= merchants
    # everyday spending is not mistaken for a subscription
    assert "wegmans 87" not in merchants
    types = {a["type"] for a in body["anomalies"]}
    assert types == {"price_hike", "duplicate"}


def test_upload_analysis_is_stateless():
    csv = "date,merchant,amount\n" + "".join(f"2026-0{m}-01,Streamly,9.99\n" for m in range(1, 5))
    r = client.post("/analyze", files={"file": ("s.csv", csv, "text/csv")})
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "upload"
    assert body["subscriptions"][0]["cadence"] == "monthly"


def test_upload_rejects_non_csv():
    r = client.post("/analyze", files={"file": ("s.txt", "hello", "text/plain")})
    assert r.status_code == 400
