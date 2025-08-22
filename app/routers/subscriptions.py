from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="", tags=["subscriptions"])

@router.get("/subscriptions", response_model=List[schemas.SubscriptionOut])
def get_subscriptions(db: Session = Depends(get_db)):
    return crud.list_subscriptions(db)

@router.get("/forecast", response_model=List[schemas.SubscriptionOut])
def forecast_next(db: Session = Depends(get_db)):
    # For now, forecast == subscriptions (contains next_charge)
    return crud.list_subscriptions(db)
