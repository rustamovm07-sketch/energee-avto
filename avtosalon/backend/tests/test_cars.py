"""
API tests for the Cars module (QISM III business rules + CRUD).

Covers: listing/filtering/search, pagination-safe ordering, detail lookup,
director CRUD, duplicate-VIN rejection and the "sold car is immutable /
undeletable" rules.
"""
from __future__ import annotations

import pytest

from app.models.car import Car, CarStatus

CARS_URL = "/api/cars"


def _car_payload(**overrides) -> dict:
    payload = {
        "brand": "Chevrolet",
        "model": "Malibu",
        "year": 2023,
        "color": "Blue",
        "price": "250000.00",
        "vin": "CARVIN0001",
        "mileage": 12000,
        "description": "Clean car",
        "image": "https://example.com/car.jpg",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Read access & filtering
# ---------------------------------------------------------------------------
class TestCarListing:
    def test_authenticated_user_can_list_cars(self, client, customer_headers, car):
        resp = client.get(CARS_URL, headers=customer_headers)

        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]["vin"] == car.vin

    def test_customer_can_see_car_details(self, client, customer_headers, car):
        resp = client.get(f"{CARS_URL}/{car.id}", headers=customer_headers)

        assert resp.status_code == 200
        assert resp.json()["id"] == car.id

    def test_unknown_car_returns_404(self, client, customer_headers):
        assert client.get(f"{CARS_URL}/999", headers=customer_headers).status_code == 404

    def test_filter_by_brand_is_case_insensitive(self, client, db_session, customer_headers):
        from tests.conftest import make_car

        make_car(db_session, brand="Toyota", model="Corolla", vin="FB1")
        make_car(db_session, brand="Kia", model="Sportage", vin="FB2")

        resp = client.get(CARS_URL, params={"brand": "toyota"}, headers=customer_headers)

        assert resp.status_code == 200
        brands = [c["brand"] for c in resp.json()]
        assert brands == ["Toyota"]

    def test_filter_by_status(self, client, db_session, customer_headers):
        from tests.conftest import make_car

        make_car(db_session, vin="FS1", status=CarStatus.available)
        make_car(db_session, vin="FS2", status=CarStatus.sold)

        resp = client.get(CARS_URL, params={"status": "sold"}, headers=customer_headers)

        assert resp.status_code == 200
        assert [c["status"] for c in resp.json()] == ["sold"]

    def test_filter_by_price_range(self, client, db_session, customer_headers):
        from tests.conftest import make_car

        make_car(db_session, vin="FP1", price="100000.00")
        make_car(db_session, vin="FP2", price="500000.00")

        resp = client.get(
            CARS_URL, params={"min_price": 200000, "max_price": 900000}, headers=customer_headers
        )

        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]["vin"] == "FP2"

    def test_search_matches_vin(self, client, db_session, customer_headers):
        from tests.conftest import make_car

        make_car(db_session, vin="UNIQUEVIN42", brand="Ford", model="Focus")
        make_car(db_session, vin="OTHERVIN99", brand="Ford", model="Fiesta")

        resp = client.get(CARS_URL, params={"search": "UNIQUEVIN42"}, headers=customer_headers)

        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_empty_list_is_returned_not_error(self, client, customer_headers):
        resp = client.get(CARS_URL, headers=customer_headers)

        assert resp.status_code == 200
        assert resp.json() == []


# ---------------------------------------------------------------------------
# Director CRUD
# ---------------------------------------------------------------------------
class TestCarCreate:
    def test_director_can_create_car(self, client, director_headers, db_session):
        resp = client.post(CARS_URL, json=_car_payload(), headers=director_headers)

        assert resp.status_code == 201
        body = resp.json()
        assert body["vin"] == "CARVIN0001"
        assert body["status"] == CarStatus.available.value
        assert db_session.query(Car).filter(Car.vin == "CARVIN0001").first() is not None

    def test_duplicate_vin_is_rejected(self, client, director_headers, car):
        resp = client.post(CARS_URL, json=_car_payload(vin=car.vin), headers=director_headers)

        assert resp.status_code == 422
        assert "vin" in resp.json()["detail"].lower()

    @pytest.mark.parametrize("field", ["brand", "model", "year", "price", "vin"])
    def test_missing_required_field_is_rejected(self, client, director_headers, field):
        payload = _car_payload()
        payload.pop(field)

        resp = client.post(CARS_URL, json=payload, headers=director_headers)

        assert resp.status_code == 422

    def test_invalid_price_type_is_rejected(self, client, director_headers):
        resp = client.post(CARS_URL, json=_car_payload(price="not-a-number"), headers=director_headers)

        assert resp.status_code == 422

    def test_anonymous_cannot_create_car(self, client):
        assert client.post(CARS_URL, json=_car_payload()).status_code == 401


class TestCarUpdate:
    def test_director_can_update_car_fields(self, client, director_headers, car):
        resp = client.put(
            f"{CARS_URL}/{car.id}",
            json={"color": "Red", "price": "199999.99"},
            headers=director_headers,
        )

        assert resp.status_code == 200
        assert resp.json()["color"] == "Red"

    def test_update_unknown_car_returns_404(self, client, director_headers):
        resp = client.put(f"{CARS_URL}/999", json={"color": "Red"}, headers=director_headers)

        assert resp.status_code == 404

    def test_sold_car_status_cannot_be_reverted(self, client, director_headers, sold_car):
        """Business rule #1: a sold car must not be reopened."""
        resp = client.put(
            f"{CARS_URL}/{sold_car.id}",
            json={"status": "available"},
            headers=director_headers,
        )

        assert resp.status_code == 422

    def test_sold_car_other_fields_can_still_be_edited(self, client, director_headers, sold_car):
        resp = client.put(
            f"{CARS_URL}/{sold_car.id}",
            json={"color": "Green"},
            headers=director_headers,
        )

        assert resp.status_code == 200
        assert resp.json()["color"] == "Green"


class TestCarDelete:
    def test_director_can_delete_available_car(self, client, director_headers, db_session, car):
        resp = client.delete(f"{CARS_URL}/{car.id}", headers=director_headers)

        assert resp.status_code == 204
        assert db_session.query(Car).filter(Car.id == car.id).first() is None

    def test_delete_unknown_car_returns_404(self, client, director_headers):
        assert client.delete(f"{CARS_URL}/999", headers=director_headers).status_code == 404

    def test_car_with_a_sale_cannot_be_deleted(self, client, director_headers, db_session, worker, customer, car):
        """Historical sale records must survive (cascade carefully)."""
        sale_resp = client.post(
            "/api/sales",
            json={
                "car_id": car.id,
                "customer_id": customer.id,
                "price": "150000.00",
                "payment_type": "cash",
            },
            headers=_worker_headers(worker),
        )
        assert sale_resp.status_code == 201

        resp = client.delete(f"{CARS_URL}/{car.id}", headers=director_headers)

        assert resp.status_code == 422


def _worker_headers(user) -> dict[str, str]:
    from tests.conftest import auth_headers

    return auth_headers(user)
