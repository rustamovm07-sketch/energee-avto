from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.application import Application
from app.models.sale import Sale
from app.models.user import User, UserRole
from app.schemas.application import ApplicationOut
from app.schemas.sale import SaleOut
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=list[UserOut])
def list_customers(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director, UserRole.worker)),
):
    query = db.query(User).filter(User.role == UserRole.customer)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(User.first_name.ilike(like), User.last_name.ilike(like), User.phone.ilike(like))
        )
    return query.order_by(User.created_at.desc()).all()


@router.put("/me", response_model=UserOut)
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Any logged-in user (customer, worker, director) can edit their own basic info.
    NOTE: this route is declared before /{customer_id} so 'me' is never
    mistaken for a numeric id."""
    update_data = payload.model_dump(exclude_unset=True)

    if "email" in update_data:
        clash = db.query(User).filter(User.email == update_data["email"], User.id != current_user.id).first()
        if clash:
            raise HTTPException(status_code=422, detail="This email is already registered")
    if "phone" in update_data:
        clash = db.query(User).filter(User.phone == update_data["phone"], User.id != current_user.id).first()
        if clash:
            raise HTTPException(status_code=422, detail="This phone number is already registered")

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{customer_id}", response_model=UserOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director, UserRole.worker)),
):
    customer = db.query(User).filter(User.id == customer_id, User.role == UserRole.customer).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.get("/{customer_id}/applications", response_model=list[ApplicationOut])
def get_customer_applications(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director, UserRole.worker)),
):
    return db.query(Application).filter(Application.customer_id == customer_id).order_by(Application.created_at.desc()).all()


@router.get("/{customer_id}/sales", response_model=list[SaleOut])
def get_customer_sales(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director, UserRole.worker)),
):
    return db.query(Sale).filter(Sale.customer_id == customer_id).order_by(Sale.created_at.desc()).all()
