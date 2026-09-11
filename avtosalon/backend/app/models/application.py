import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ApplicationStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    completed = "completed"
    cancelled = "cancelled"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    phone = Column(String(30), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.new)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("User", foreign_keys=[customer_id], back_populates="applications_as_customer")
    worker = relationship("User", foreign_keys=[worker_id], back_populates="applications_as_worker")
    car = relationship("Car", back_populates="applications")
