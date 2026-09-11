from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import CustomerRegister, LoginRequest, Token, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _check_duplicate_email_phone(db: Session, email: str, phone: str):
    existing = db.query(User).filter(or_(User.email == email, User.phone == phone)).first()
    if existing:
        if existing.email == email:
            raise HTTPException(status_code=422, detail="This email is already registered")
        raise HTTPException(status_code=422, detail="This phone number is already registered")


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_customer(payload: CustomerRegister, db: Session = Depends(get_db)):
    """Public self-registration. Role is always forced to 'customer'."""
    _check_duplicate_email_phone(db, payload.email, payload.phone)

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.customer,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(or_(User.email == payload.identifier, User.phone == payload.identifier))
        .first()
    )

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/phone or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return Token(access_token=access_token, user=user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
