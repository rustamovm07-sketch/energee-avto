from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models.car import Car
from app.models.favorite import Favorite
from app.models.user import User, UserRole
from app.schemas.favorite import FavoriteOut

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteOut])
def list_my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer)),
):
    return (
        db.query(Favorite)
        .filter(Favorite.customer_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )


@router.post("/{car_id}", response_model=FavoriteOut, status_code=status.HTTP_201_CREATED)
def add_favorite(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer)),
):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    existing = (
        db.query(Favorite)
        .filter(Favorite.customer_id == current_user.id, Favorite.car_id == car_id)
        .first()
    )
    if existing:
        return existing

    favorite = Favorite(customer_id=current_user.id, car_id=car_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite


@router.delete("/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer)),
):
    favorite = (
        db.query(Favorite)
        .filter(Favorite.customer_id == current_user.id, Favorite.car_id == car_id)
        .first()
    )
    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")

    db.delete(favorite)
    db.commit()
    return None
