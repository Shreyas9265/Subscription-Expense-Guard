from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    merchant = Column(String, index=True)
    amount = Column(Float)  # negative for debits if needed; we'll use absolute when appropriate
    category = Column(String, nullable=True)
    currency = Column(String, default="USD")
    normalized_merchant = Column(String, index=True)


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    normalized_merchant = Column(String, index=True)
    cadence = Column(String)  # 'monthly' or 'weekly' (simple for demo)
    avg_amount = Column(Float)
    last_charge = Column(Date)
    next_charge = Column(Date)


class Anomaly(Base):
    __tablename__ = "anomalies"
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    type = Column(String)  # 'price_hike', 'duplicate', 'new_high_charge'
    message = Column(String)

    transaction = relationship("Transaction")
