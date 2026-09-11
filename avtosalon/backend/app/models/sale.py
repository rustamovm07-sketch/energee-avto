import enum

from sqlalchemy import Column, Integer, Numeric, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class PaymentType(str, enum.Enum):
    cash = "cash"
    card = "card"
    bank = "bank"


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id"), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    price = Column(Numeric(12, 2), nullable=False)
    payment_type = Column(Enum(PaymentType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    car = relationship("Car", back_populates="sale")
    customer = relationship("User", foreign_keys=[customer_id], back_populates="sales_as_customer")
    worker = relationship("User", foreign_keys=[worker_id], back_populates="sales_as_worker")
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")
