from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.sale import PaymentType


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sale_id: int
    amount: Decimal
    payment_type: PaymentType
    created_at: datetime
