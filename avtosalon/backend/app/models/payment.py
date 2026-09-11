from sqlalchemy import Column, Integer, Numeric, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.sale import PaymentType


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_type = Column(Enum(PaymentType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sale = relationship("Sale", back_populates="payments")
