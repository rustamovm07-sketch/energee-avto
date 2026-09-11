from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.application import ApplicationStatus
from app.schemas.car import CarOut
from app.schemas.user import UserOut


class ApplicationCreate(BaseModel):
    car_id: int
    phone: str
    message: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    worker_id: Optional[int] = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    car_id: int
    worker_id: Optional[int] = None
    phone: Optional[str] = None
    message: Optional[str] = None
    status: ApplicationStatus
    created_at: datetime
    car: Optional[CarOut] = None
    customer: Optional[UserOut] = None
    worker: Optional[UserOut] = None
