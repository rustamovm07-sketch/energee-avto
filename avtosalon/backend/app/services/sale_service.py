"""
Business logic for creating a sale.

Kept separate from the router so the "sale + payment + car status" flow
stays a single well-tested unit, and so it's easy to extend later
(e.g. credit/installment logic) without touching the HTTP layer.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.car import Car, CarStatus
from app.models.payment import Payment
from app.models.sale import Sale
from app.models.user import User, UserRole
from app.schemas.sale import SaleCreate


def create_sale(db: Session, payload: SaleCreate, worker: User) -> Sale:
    car = db.query(Car).filter(Car.id == payload.car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    # Business rule #1: a sold car can never be resold.
    if car.status == CarStatus.sold:
        raise HTTPException(status_code=422, detail="This car has already been sold")

    customer = db.query(User).filter(User.id == payload.customer_id, User.role == UserRole.customer).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    sale = Sale(
        car_id=car.id,
        customer_id=customer.id,
        worker_id=worker.id,
        price=payload.price,
        payment_type=payload.payment_type,
    )
    db.add(sale)

    # Car flips to sold as soon as the sale is recorded.
    car.status = CarStatus.sold

    db.flush()  # get sale.id before creating the payment row

    payment = Payment(
        sale_id=sale.id,
        amount=payload.price,
        payment_type=payload.payment_type,
    )
    db.add(payment)

    db.commit()
    db.refresh(sale)
    return sale
