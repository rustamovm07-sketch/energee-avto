from decimal import Decimal
from typing import List

from pydantic import BaseModel

from app.schemas.sale import SaleOut


class DashboardStats(BaseModel):
    total_cars: int
    available_cars: int
    sold_cars: int
    total_customers: int
    total_workers: int
    total_sales: int
    total_revenue: Decimal
    recent_sales: List[SaleOut]
