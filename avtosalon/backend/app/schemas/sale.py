from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.sale import PaymentType
from app.schemas.car import CarOut
from app.schemas.user import UserOut


class SaleCreate(BaseModel):
    car_id: int
    customer_id: int
    price: Decimal
    payment_type: PaymentType


class SaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    car_id: int
    customer_id: int
    worker_id: int
    price: Decimal
    payment_type: PaymentType
    created_at: datetime
    car: Optional[CarOut] = None
    customer: Optional[UserOut] = None
    worker: Optional[UserOut] = None
