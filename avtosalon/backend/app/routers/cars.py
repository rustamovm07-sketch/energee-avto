from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.car import Car, CarStatus
from app.models.sale import Sale
from app.models.user import User, UserRole
from app.schemas.car import CarCreate, CarOut, CarUpdate

router = APIRouter(prefix="/api/cars", tags=["cars"])


@router.get("", response_model=list[CarOut])
def list_cars(
    brand: Optional[str] = None,
    model: Optional[str] = None,
    status_filter: Optional[CarStatus] = Query(None, alias="status"),
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Any authenticated role can browse cars. Filters are all optional."""
    query = db.query(Car)

    if brand:
        query = query.filter(Car.brand.ilike(f"%{brand}%"))
    if model:
        query = query.filter(Car.model.ilike(f"%{model}%"))
    if status_filter:
        query = query.filter(Car.status == status_filter)
    if min_price is not None:
        query = query.filter(Car.price >= min_price)
    if max_price is not None:
        query = query.filter(Car.price <= max_price)
    if search:
        like = f"%{search}%"
        query = query.filter((Car.brand.ilike(like)) | (Car.model.ilike(like)) | (Car.vin.ilike(like)))

    return query.order_by(Car.created_at.desc()).all()


@router.get("/{car_id}", response_model=CarOut)
def get_car(car_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    return car


@router.post("", response_model=CarOut, status_code=status.HTTP_201_CREATED)
def create_car(
    payload: CarCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    existing_vin = db.query(Car).filter(Car.vin == payload.vin).first()
    if existing_vin:
        raise HTTPException(status_code=422, detail="A car with this VIN already exists")

    car = Car(**payload.model_dump())
    db.add(car)
    db.commit()
    db.refresh(car)
    return car


@router.put("/{car_id}", response_model=CarOut)
def update_car(
    car_id: int,
    payload: CarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    # Business rule: a sold car cannot be resold / reopened by editing status back.
    if car.status == CarStatus.sold and payload.status and payload.status != CarStatus.sold:
        raise HTTPException(status_code=422, detail="A sold car's status cannot be changed")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(car, field, value)

    db.commit()
    db.refresh(car)
    return car


@router.delete("/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_car(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director)),
):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    sold = db.query(Sale).filter(Sale.car_id == car_id).first()
    if sold:
        raise HTTPException(status_code=422, detail="Cannot delete a car that has already been sold")

    db.delete(car)
    db.commit()
    return None
