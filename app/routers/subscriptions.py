from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="", tags=["subscriptions"])


@router.get("/subscriptions", response_model=list[schemas.SubscriptionOut])
def get_subscriptions(db: Session = Depends(get_db)):
    return crud.list_subscriptions(db)


@router.get("/forecast", response_model=list[schemas.SubscriptionOut])
def forecast_next(db: Session = Depends(get_db)):
    # For now, forecast == subscriptions (contains next_charge)
    return crud.list_subscriptions(db)
