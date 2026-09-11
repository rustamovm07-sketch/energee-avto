from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models.car import Car, CarStatus
from app.models.payment import Payment
from app.models.sale import Sale
from app.models.user import User, UserRole
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    """All numbers here come straight from the database - no fake/static data."""
    total_cars = db.query(func.count(Car.id)).scalar() or 0
    available_cars = db.query(func.count(Car.id)).filter(Car.status == CarStatus.available).scalar() or 0
    sold_cars = db.query(func.count(Car.id)).filter(Car.status == CarStatus.sold).scalar() or 0
    total_customers = db.query(func.count(User.id)).filter(User.role == UserRole.customer).scalar() or 0
    total_workers = db.query(func.count(User.id)).filter(User.role == UserRole.worker).scalar() or 0
    total_sales = db.query(func.count(Sale.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or Decimal("0")

    recent_sales = db.query(Sale).order_by(Sale.created_at.desc()).limit(10).all()

    return DashboardStats(
        total_cars=total_cars,
        available_cars=available_cars,
        sold_cars=sold_cars,
        total_customers=total_customers,
        total_workers=total_workers,
        total_sales=total_sales,
        total_revenue=total_revenue,
        recent_sales=recent_sales,
    )
