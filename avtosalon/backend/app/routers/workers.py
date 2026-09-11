from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.auth.security import hash_password
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserUpdate, WorkerCreate

router = APIRouter(prefix="/api/workers", tags=["workers"])


@router.get("", response_model=list[UserOut])
def list_workers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    return db.query(User).filter(User.role == UserRole.worker).order_by(User.created_at.desc()).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_worker(
    payload: WorkerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    existing = db.query(User).filter(or_(User.email == payload.email, User.phone == payload.phone)).first()
    if existing:
        if existing.email == payload.email:
            raise HTTPException(status_code=422, detail="This email is already registered")
        raise HTTPException(status_code=422, detail="This phone number is already registered")

    worker = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.worker,
        is_active=True,
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


@router.get("/{worker_id}", response_model=UserOut)
def get_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    worker = db.query(User).filter(User.id == worker_id, User.role == UserRole.worker).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return worker


@router.put("/{worker_id}", response_model=UserOut)
def update_worker(
    worker_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    worker = db.query(User).filter(User.id == worker_id, User.role == UserRole.worker).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(worker, field, value)

    db.commit()
    db.refresh(worker)
    return worker


@router.patch("/{worker_id}/toggle-active", response_model=UserOut)
def toggle_worker_active(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    """Activate or deactivate a worker. A deactivated worker cannot log in."""
    worker = db.query(User).filter(User.id == worker_id, User.role == UserRole.worker).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    worker.is_active = not worker.is_active
    db.commit()
    db.refresh(worker)
    return worker


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    worker = db.query(User).filter(User.id == worker_id, User.role == UserRole.worker).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    db.delete(worker)
    db.commit()
    return None
