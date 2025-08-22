from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="", tags=["anomalies"])

@router.get("/anomalies", response_model=List[schemas.AnomalyOut])
def get_anomalies(db: Session = Depends(get_db), limit: int = 100):
    return crud.list_anomalies(db, limit=limit)
