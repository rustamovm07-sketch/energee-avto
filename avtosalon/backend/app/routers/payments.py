from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models.payment import Payment
from app.models.user import User, UserRole
from app.schemas.payment import PaymentOut

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("", response_model=list[PaymentOut])
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    return db.query(Payment).order_by(Payment.created_at.desc()).all()


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment
