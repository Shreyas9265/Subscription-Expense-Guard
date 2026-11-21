import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.analysis import SAMPLE_CSV, analyze_csv

router = APIRouter(prefix="/analyze", tags=["analyze"])

MAX_BYTES = 2 * 1024 * 1024  # 2 MB is plenty for a few years of statements


@router.get("/sample")
def analyze_sample():
    """Full analysis of the bundled 6-month demo statement (synthetic data)."""
    return {"source": "sample", **analyze_csv(SAMPLE_CSV)}


@router.post("")
async def analyze_upload(file: UploadFile = File(...)):
    """Analyze an uploaded CSV in one request. Nothing is stored."""
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="CSV is larger than 2 MB.")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        tmp.write(data)
        path = tmp.name
    try:
        result = analyze_csv(path)
    finally:
        os.remove(path)
    if not result["transactions"]:
        raise HTTPException(
            status_code=422,
            detail="No transactions found. The CSV needs date, merchant and amount columns.",
        )
    return {"source": "upload", **result}
