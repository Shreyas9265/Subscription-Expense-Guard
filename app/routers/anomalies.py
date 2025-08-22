from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="", tags=["anomalies"])


@router.get("/anomalies", response_model=list[schemas.AnomalyOut])
def get_anomalies(db: Session = Depends(get_db), limit: int = 100):
    return crud.list_anomalies(db, limit=limit)
