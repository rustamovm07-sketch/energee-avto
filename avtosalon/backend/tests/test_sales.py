"""
API + service tests for the Sales module.

Focuses on the critical business rules from QISM III:
  * creating a sale flips the car to SOLD
  * a payment row is created together with the sale (same transaction)
  * a SOLD car can never be sold twice
  * worker must be authorized and the customer must exist
  * price must be > 0
"""
from __future__ import annotations

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.car import CarStatus
from app.models.payment import Payment
from app.models.sale import Sale
from app.schemas.sale import SaleCreate
from app.services.sale_service import create_sale

SALES_URL = "/api/sales"


def _sale_payload(car, customer, **overrides) -> dict:
    payload = {
        "car_id": car.id,
        "customer_id": customer.id,
        "price": "150000.00",
        "payment_type": "cash",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Happy path (via the HTTP API)
# ---------------------------------------------------------------------------
class TestCreateSaleSuccess:
    def test_worker_can_create_sale(self, client, worker_headers, car, customer):
        resp = client.post(SALES_URL, json=_sale_payload(car, customer), headers=worker_headers)

        assert resp.status_code == 201
        body = resp.json()
        assert body["car_id"] == car.id
        assert body["customer_id"] == customer.id
        assert body["payment_type"] == "cash"

    def test_director_can_create_sale(self, client, director_headers, car, customer):
        resp = client.post(SALES_URL, json=_sale_payload(car, customer), headers=director_headers)

        assert resp.status_code == 201

    def test_created_sale_sets_car_status_to_sold(self, client, worker_headers, db_session, car, customer):
        client.post(SALES_URL, json=_sale_payload(car, customer), headers=worker_headers)

        db_session.refresh(car)
        assert car.status == CarStatus.sold

    def test_created_sale_creates_a_matching_payment(self, client, worker_headers, db_session, car, customer):
        sale = client.post(SALES_URL, json=_sale_payload(car, customer), headers=worker_headers).json()

        payment = db_session.query(Payment).filter(Payment.sale_id == sale["id"]).first()
        assert payment is not None
        assert str(payment.amount) == "150000.00"

    @pytest.mark.parametrize("payment_type", ["cash", "card", "bank"])
    def test_all_payment_types_are_accepted(self, client, db_session, worker_headers, customer, payment_type):
        from tests.conftest import make_car

        car = make_car(db_session, vin=f"PT{payment_type}", brand="Brand", model="Model")

        resp = client.post(
            SALES_URL,
            json=_sale_payload(car, customer, payment_type=payment_type),
            headers=worker_headers,
        )

        assert resp.status_code == 201
        assert resp.json()["payment_type"] == payment_type


# ---------------------------------------------------------------------------
# Business-rule violations
# ---------------------------------------------------------------------------
class TestCreateSaleBusinessRules:
    def test_cannot_resell_a_sold_car(self, client, worker_headers, sold_car, customer):
        resp = client.post(SALES_URL, json=_sale_payload(sold_car, customer), headers=worker_headers)

        assert resp.status_code == 422
        assert "sold" in resp.json()["detail"].lower()

    def test_selling_twice_is_rejected_on_second_attempt(self, client, db_session, worker_headers, car, customer):
        first = client.post(SALES_URL, json=_sale_payload(car, customer), headers=worker_headers)
        assert first.status_code == 201

        db_session.expire_all()
        second = client.post(SALES_URL, json=_sale_payload(car, customer), headers=worker_headers)

        assert second.status_code == 422

    def test_unknown_car_returns_404(self, client, worker_headers, customer):
        resp = client.post(
            SALES_URL,
            json={"car_id": 999, "customer_id": customer.id, "price": "1.00", "payment_type": "cash"},
            headers=worker_headers,
        )

        assert resp.status_code == 404

    def test_unknown_customer_returns_404(self, client, worker_headers, car):
        resp = client.post(
            SALES_URL,
            json={"car_id": car.id, "customer_id": 999, "price": "1.00", "payment_type": "cash"},
            headers=worker_headers,
        )

        assert resp.status_code == 404

    def test_selling_to_a_non_customer_user_is_rejected(
        self, client, worker_headers, director, car
    ):
        """The 'customer_id' must actually reference a customer, not staff."""
        resp = client.post(
            SALES_URL,
            json={"car_id": car.id, "customer_id": director.id, "price": "1.00", "payment_type": "cash"},
            headers=worker_headers,
        )

        assert resp.status_code == 404

    def test_invalid_payment_type_is_rejected(self, client, worker_headers, car, customer):
        resp = client.post(
            SALES_URL, json=_sale_payload(car, customer, payment_type="bitcoin"), headers=worker_headers
        )

        assert resp.status_code == 422

    def test_missing_required_field_is_rejected(self, client, worker_headers, car):
        resp = client.post(
            SALES_URL,
            json={"car_id": car.id, "price": "100.00", "payment_type": "cash"},
            headers=worker_headers,
        )

        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Service-layer tests (transaction integrity, isolation from HTTP)
# ---------------------------------------------------------------------------
class TestSaleServiceTransaction:
    def test_service_creates_sale_payment_and_updates_car_atomically(
        self, db_session: Session, worker, customer, car
    ):
        sale = create_sale(
            db_session,
            SaleCreate(car_id=car.id, customer_id=customer.id, price="123456.78", payment_type="bank"),
            worker,
        )

        assert isinstance(sale, Sale)
        db_session.refresh(car)
        assert car.status == CarStatus.sold

        payments = db_session.query(Payment).filter(Payment.sale_id == sale.id).all()
        assert len(payments) == 1
        assert str(payments[0].amount) == "123456.78"

    def test_service_raises_when_car_already_sold(self, db_session: Session, worker, customer, sold_car):
        with pytest.raises(HTTPException) as exc:
            create_sale(
                db_session,
                SaleCreate(car_id=sold_car.id, customer_id=customer.id, price="1.00", payment_type="cash"),
                worker,
            )

        assert exc.value.status_code == 422

    def test_service_leaves_no_orphan_records_when_car_missing(
        self, db_session: Session, worker, customer
    ):
        before_sales = db_session.query(Sale).count()

        with pytest.raises(HTTPException):
            create_sale(
                db_session,
                SaleCreate(car_id=424242, customer_id=customer.id, price="1.00", payment_type="cash"),
                worker,
            )

        assert db_session.query(Sale).count() == before_sales
        assert db_session.query(Payment).count() == 0


# ---------------------------------------------------------------------------
# Listing / role scoping
# ---------------------------------------------------------------------------
class TestSaleListing:
    def test_customer_is_forbidden_from_listing_sales(self, client, customer_headers):
        assert client.get(SALES_URL, headers=customer_headers).status_code == 403

    def test_anonymous_is_unauthorized(self, client):
        assert client.get(SALES_URL).status_code == 401

    def test_director_sees_sale_details(self, client, director_headers, worker_headers, car, customer):
        created = client.post(SALES_URL, json=_sale_payload(car, customer), headers=worker_headers).json()

        resp = client.get(f"{SALES_URL}/{created['id']}", headers=director_headers)

        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]

    def test_unknown_sale_returns_404(self, client, director_headers):
        assert client.get(f"{SALES_URL}/999", headers=director_headers).status_code == 404

    def test_date_filters_do_not_crash_on_empty_range(self, client, director_headers, worker_headers, car, customer):
        client.post(SALES_URL, json=_sale_payload(car, customer), headers=worker_headers)

        resp = client.get(
            SALES_URL,
            params={"date_from": "2000-01-01", "date_to": "2000-01-02"},
            headers=director_headers,
        )

        assert resp.status_code == 200
        assert resp.json() == []
