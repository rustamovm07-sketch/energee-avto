from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.application import Application
from app.models.car import Car, CarStatus
from app.models.user import User, UserRole
from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationUpdate

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("", response_model=list[ApplicationOut])
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Director/worker see all applications.
    Customer sees only their own applications (business rule #2).
    """
    query = db.query(Application)
    if current_user.role == UserRole.customer:
        query = query.filter(Application.customer_id == current_user.id)
    return query.order_by(Application.created_at.desc()).all()


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer)),
):
    car = db.query(Car).filter(Car.id == payload.car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    if car.status == CarStatus.sold:
        raise HTTPException(status_code=422, detail="This car has already been sold")

    application = Application(
        customer_id=current_user.id,
        car_id=payload.car_id,
        phone=payload.phone,
        message=payload.message,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if current_user.role == UserRole.customer and application.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view this application")

    return application


@router.put("/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.director, UserRole.worker)),
):
    """Worker/director update status and can assign themselves to an application."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    update_data = payload.model_dump(exclude_unset=True)

    # If a worker touches an unassigned application, auto-assign them to it.
    if current_user.role == UserRole.worker and application.worker_id is None:
        application.worker_id = current_user.id

    for field, value in update_data.items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)
    return application
