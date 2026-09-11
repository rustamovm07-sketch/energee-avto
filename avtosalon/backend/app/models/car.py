import enum

from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class CarStatus(str, enum.Enum):
    available = "available"
    reserved = "reserved"
    sold = "sold"


class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(100), nullable=False, index=True)
    model = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    color = Column(String(50), nullable=True)
    price = Column(Numeric(12, 2), nullable=False)
    vin = Column(String(50), unique=True, index=True, nullable=False)
    mileage = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    image = Column(String(500), nullable=True)
    status = Column(Enum(CarStatus), nullable=False, default=CarStatus.available, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    applications = relationship("Application", back_populates="car")
    sale = relationship("Sale", back_populates="car", uselist=False)
    favorited_by = relationship("Favorite", back_populates="car", cascade="all, delete-orphan")
