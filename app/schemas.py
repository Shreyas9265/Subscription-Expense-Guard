from datetime import date

from pydantic import BaseModel


class TransactionCreate(BaseModel):
    date: date
    merchant: str
    amount: float
    category: str | None = None
    currency: str | None = "USD"


class TransactionOut(BaseModel):
    id: int
    date: date
    merchant: str
    amount: float
    category: str | None
    currency: str
    normalized_merchant: str

    class Config:
        from_attributes = True


class SubscriptionOut(BaseModel):
    id: int
    normalized_merchant: str
    cadence: str
    avg_amount: float
    last_charge: date
    next_charge: date

    class Config:
        from_attributes = True


class AnomalyOut(BaseModel):
    id: int
    type: str
    message: str
    transaction: TransactionOut

    class Config:
        from_attributes = True
