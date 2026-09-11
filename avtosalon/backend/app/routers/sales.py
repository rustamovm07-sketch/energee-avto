from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models.sale import Sale
from app.models.user import User, UserRole
from app.schemas.sale import SaleCreate, SaleOut
from app.services.sale_service import create_sale

router = APIRouter(prefix="/api/sales", tags=["sales"])


@router.get("", response_model=list[SaleOut])
def list_sales(
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director, UserRole.worker)),
):
    """
    Director sees all sales.
    Worker sees only their own sales (business rule #3).
    """
    query = db.query(Sale)
    if current_user.role == UserRole.worker:
        query = query.filter(Sale.worker_id == current_user.id)

    if date_from:
        query = query.filter(Sale.created_at >= date_from)
    if date_to:
        query = query.filter(Sale.created_at <= date_to)

    sales = query.order_by(Sale.created_at.desc()).all()

    if search:
        needle = search.lower()
        sales = [
            s for s in sales
            if needle in (s.car.brand + " " + s.car.model).lower()
            or needle in (s.customer.first_name + " " + s.customer.last_name).lower()
        ]

    return sales


@router.post("", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
def create_sale_endpoint(
    payload: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director, UserRole.worker)),
):
    return create_sale(db, payload, current_user)


@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director, UserRole.worker)),
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")

    if current_user.role == UserRole.worker and sale.worker_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view this sale")

    return sale
