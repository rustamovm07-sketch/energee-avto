from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.car import CarStatus


class CarBase(BaseModel):
    brand: str
    model: str
    year: int
    color: Optional[str] = None
    price: Decimal
    vin: str
    mileage: Optional[int] = 0
    description: Optional[str] = None
    image: Optional[str] = None


class CarCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    price: Optional[Decimal] = None
    vin: Optional[str] = None
    mileage: Optional[int] = None
    description: Optional[str] = None
    image: Optional[str] = None
    status: Optional[CarStatus] = None


class CarOut(CarBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: CarStatus
    created_at: datetime
    updated_at: datetime
