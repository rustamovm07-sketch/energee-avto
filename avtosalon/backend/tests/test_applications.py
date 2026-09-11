"""
API tests for the Applications module (QISM III rule #14, QISM IV.9).

  * a customer can apply for an available car
  * applying for a SOLD car is rejected
  * the car must exist
  * only directors/workers may change status & assign
  * workers get auto-assigned to applications they touch
"""
from __future__ import annotations

import pytest

from app.models.application import ApplicationStatus

APPS_URL = "/api/applications"


def _app_payload(car, **overrides) -> dict:
    payload = {"car_id": car.id, "phone": "+998901234567", "message": "I am interested"}
    payload.update(overrides)
    return payload


class TestCreateApplicationPositive:
    def test_customer_can_create_application_for_available_car(self, client, customer_headers, car):
        resp = client.post(APPS_URL, json=_app_payload(car), headers=customer_headers)

        assert resp.status_code == 201
        body = resp.json()
        assert body["car_id"] == car.id
        assert body["status"] == ApplicationStatus.new.value

    def test_customer_can_apply_for_reserved_car(self, client, db_session, customer_headers, customer):
        """Only SOLD cars are blocked; reserved cars are still actionable."""
        from tests.conftest import make_car
        from app.models.car import CarStatus

        reserved = make_car(db_session, vin="RESV01", status=CarStatus.reserved)

        resp = client.post(APPS_URL, json=_app_payload(reserved), headers=customer_headers)

        assert resp.status_code == 201

    def test_application_is_linked_to_the_authenticated_customer(
        self, client, customer_headers, customer, car
    ):
        body = client.post(APPS_URL, json=_app_payload(car), headers=customer_headers).json()

        assert body["customer_id"] == customer.id

    def test_customer_can_fetch_their_application(self, client, customer_headers, car):
        created = client.post(APPS_URL, json=_app_payload(car), headers=customer_headers).json()

        resp = client.get(f"{APPS_URL}/{created['id']}", headers=customer_headers)

        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]


class TestCreateApplicationNegative:
    def test_cannot_apply_for_sold_car(self, client, customer_headers, sold_car):
        resp = client.post(APPS_URL, json=_app_payload(sold_car), headers=customer_headers)

        assert resp.status_code == 422

    def test_unknown_car_returns_404(self, client, customer_headers):
        resp = client.post(
            APPS_URL, json={"car_id": 999, "phone": "+998901234567"}, headers=customer_headers
        )

        assert resp.status_code == 404

    def test_worker_cannot_create_application(self, client, worker_headers, car):
        """Only customers self-apply via this endpoint."""
        resp = client.post(APPS_URL, json=_app_payload(car), headers=worker_headers)

        assert resp.status_code == 403

    def test_director_cannot_create_application(self, client, director_headers, car):
        resp = client.post(APPS_URL, json=_app_payload(car), headers=director_headers)

        assert resp.status_code == 403

    def test_anonymous_cannot_create_application(self, client, car):
        assert client.post(APPS_URL, json=_app_payload(car)).status_code == 401

    def test_missing_car_id_is_rejected(self, client, customer_headers):
        resp = client.post(APPS_URL, json={"phone": "+998901234567"}, headers=customer_headers)

        assert resp.status_code == 422


class TestApplicationStatusUpdates:
    def test_worker_can_update_status_and_is_auto_assigned(self, client, worker_headers, customer_headers, car, worker):
        created = client.post(APPS_URL, json=_app_payload(car), headers=customer_headers).json()

        resp = client.put(
            f"{APPS_URL}/{created['id']}", json={"status": "contacted"}, headers=worker_headers
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == ApplicationStatus.contacted.value
        assert body["worker_id"] == worker.id

    def test_director_can_assign_a_worker(self, client, director_headers, customer_headers, car, worker):
        created = client.post(APPS_URL, json=_app_payload(car), headers=customer_headers).json()

        resp = client.put(
            f"{APPS_URL}/{created['id']}", json={"worker_id": worker.id}, headers=director_headers
        )

        assert resp.status_code == 200
        assert resp.json()["worker_id"] == worker.id

    def test_customer_cannot_update_application_status(self, client, customer_headers, car):
        created = client.post(APPS_URL, json=_app_payload(car), headers=customer_headers).json()

        resp = client.put(
            f"{APPS_URL}/{created['id']}", json={"status": "completed"}, headers=customer_headers
        )

        assert resp.status_code == 403

    def test_invalid_status_value_is_rejected(self, client, worker_headers, customer_headers, car):
        created = client.post(APPS_URL, json=_app_payload(car), headers=customer_headers).json()

        resp = client.put(
            f"{APPS_URL}/{created['id']}", json={"status": "not-a-status"}, headers=worker_headers
        )

        assert resp.status_code == 422

    def test_update_unknown_application_returns_404(self, client, worker_headers):
        resp = client.put(f"{APPS_URL}/999", json={"status": "contacted"}, headers=worker_headers)

        assert resp.status_code == 404


class TestApplicationListing:
    def test_director_sees_all_applications(self, client, db_session, director_headers, customer, customer_headers):
        from tests.conftest import make_car

        car_a = make_car(db_session, vin="APPA1")
        car_b = make_car(db_session, vin="APPA2")
        client.post(APPS_URL, json=_app_payload(car_a), headers=customer_headers)
        client.post(APPS_URL, json=_app_payload(car_b), headers=customer_headers)

        resp = client.get(APPS_URL, headers=director_headers)

        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_customer_sees_only_their_own(self, client, db_session, customer_headers, other_customer, car):
        from app.models.application import Application
        from tests.conftest import auth_headers

        mine = Application(customer_id=1, car_id=car.id, phone="+998900000001")
        db_session.add(mine)
        from app.models.application import Application as App

        db_session.add(App(customer_id=other_customer.id, car_id=car.id, phone="+998900000002"))
        db_session.commit()

        resp = client.get(APPS_URL, headers=customer_headers)

        assert resp.status_code == 200
        # every returned application belongs to the authenticated customer
        assert all(a["customer_id"] == mine.customer_id for a in resp.json())

    def test_unknown_application_returns_404(self, client, director_headers):
        assert client.get(f"{APPS_URL}/999", headers=director_headers).status_code == 404

    def test_anonymous_cannot_list_applications(self, client):
        assert client.get(APPS_URL).status_code == 401
