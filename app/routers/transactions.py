import os
import shutil
import tempfile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app import crud, ingestion, schemas
from app.database import get_db

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("/csv")
def ingest_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith((".csv", ".CSV")):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        count = ingestion.ingest_transactions(db, tmp_path)
        crud.recompute_subscriptions(db)
        crud.recompute_anomalies(db)
        return {"ingested": count}
    finally:
        os.remove(tmp_path)


@router.get("/transactions", response_model=list[schemas.TransactionOut], tags=["transactions"])
def list_transactions(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    txns = crud.list_transactions(db, limit=limit, offset=offset)
    return txns
