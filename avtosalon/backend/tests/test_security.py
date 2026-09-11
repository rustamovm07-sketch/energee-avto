"""
Role-Based Access Control (RBAC) and data-isolation tests.

These mirror the "Xavfsizlik testlari" checklist from QISM VII of the spec:
  * Customer  -> Director/Worker endpoint  : must be 403
  * Worker    -> Director endpoint         : must be 403
  * Worker    -> other worker's sales      : must be 403 / invisible
  * Customer  -> other customer's data     : must be 403 / invisible
  * Inactive worker                        : must be denied
  * No / invalid / expired JWT             : must be 401
Nothing here may be bypassable.
"""
from __future__ import annotations

from datetime import timedelta

import pytest
from app.auth.security import create_access_token

# Strictly director-only endpoints (the spec's permission matrix), used as the
# "protected gate" for the role checks below. Note: /api/customers is NOT in
# this list because the matrix grants workers read-only customer access.
DIRECTOR_ONLY_ENDPOINTS = [
    ("GET", "/api/workers"),
    ("GET", "/api/payments"),
    ("GET", "/api/dashboard/stats"),
]


class TestRoleProtectionMatrix:
    @pytest.mark.parametrize("method,url", DIRECTOR_ONLY_ENDPOINTS)
    def test_customer_is_forbidden_on_director_endpoints(self, client, customer_headers, method, url):
        resp = client.request(method, url, headers=customer_headers)

        assert resp.status_code == 403

    @pytest.mark.parametrize("method,url", DIRECTOR_ONLY_ENDPOINTS)
    def test_worker_is_forbidden_on_director_endpoints(self, client, worker_headers, method, url):
        resp = client.request(method, url, headers=worker_headers)

        assert resp.status_code == 403

    @pytest.mark.parametrize("method,url", DIRECTOR_ONLY_ENDPOINTS)
    def test_anonymous_is_unauthorized_on_director_endpoints(self, client, method, url):
        resp = client.request(method, url)

        assert resp.status_code == 401

    @pytest.mark.parametrize("method,url", DIRECTOR_ONLY_ENDPOINTS)
    def test_director_is_allowed_on_director_endpoints(self, client, director_headers, method, url):
        resp = client.request(method, url, headers=director_headers)

        assert resp.status_code == 200


class TestCarsWriteProtection:
    """Only a director may create/update/delete cars."""

    CAR_PAYLOAD = {
        "brand": "Toyota",
        "model": "Camry",
        "year": 2023,
        "color": "Black",
        "price": "300000.00",
        "vin": "RBACVIN001",
        "mileage": 10,
        "description": "RBAC test car",
    }

    def test_worker_cannot_create_car(self, client, worker_headers):
        resp = client.post("/api/cars", json=self.CAR_PAYLOAD, headers=worker_headers)

        assert resp.status_code == 403

    def test_customer_cannot_create_car(self, client, customer_headers):
        resp = client.post("/api/cars", json=self.CAR_PAYLOAD, headers=customer_headers)

        assert resp.status_code == 403

    def test_director_can_create_car(self, client, director_headers):
        resp = client.post("/api/cars", json=self.CAR_PAYLOAD, headers=director_headers)

        assert resp.status_code == 201

    def test_worker_cannot_delete_car(self, client, worker_headers, car):
        resp = client.delete(f"/api/cars/{car.id}", headers=worker_headers)

        assert resp.status_code == 403

    def test_customer_cannot_update_car(self, client, customer_headers, car):
        resp = client.put(f"/api/cars/{car.id}", json={"color": "Red"}, headers=customer_headers)

        assert resp.status_code == 403


class TestWorkerCustomerReadAccess:
    """The permission matrix grants workers read-only access to customers."""

    def test_worker_can_list_customers(self, client, worker_headers):
        resp = client.get("/api/customers", headers=worker_headers)

        assert resp.status_code == 200
class TestWorkerDataIsolation:
    def test_worker_only_sees_their_own_sales(self, client, db_session, director, worker, customer):
        """Two workers each make a sale; each may only see their own."""
        from tests.conftest import auth_headers, make_car

        car_for_worker_a = make_car(db_session, vin="WSALE01", brand="Audi", model="A4")
        car_for_worker_b = make_car(db_session, vin="WSALE02", brand="BMW", model="X5")

        # `worker` (fixture) makes sale #1
        r1 = client.post(
            "/api/sales",
            json={
                "car_id": car_for_worker_a.id,
                "customer_id": customer.id,
                "price": "100000.00",
                "payment_type": "cash",
            },
            headers=auth_headers(worker),
        )
        assert r1.status_code == 201

        # A *second* worker makes sale #2
        other_worker = _create_user(db_session, email="w2@example.com", phone="+998900000099")
        r2 = client.post(
            "/api/sales",
            json={
                "car_id": car_for_worker_b.id,
                "customer_id": customer.id,
                "price": "200000.00",
                "payment_type": "card",
            },
            headers=auth_headers(other_worker),
        )
        assert r2.status_code == 201

        listed = client.get("/api/sales", headers=auth_headers(worker))
        assert listed.status_code == 200
        sale_ids = [s["id"] for s in listed.json()]

        assert r1.json()["id"] in sale_ids
        assert r2.json()["id"] not in sale_ids

    def test_worker_cannot_fetch_other_workers_sale_by_id(self, client, db_session, worker, customer):
        from tests.conftest import auth_headers, make_car

        car = make_car(db_session, vin="WSALE03", brand="Kia", model="Rio")
        other_worker = _create_user(db_session, email="w3@example.com", phone="+998900000098")

        created = client.post(
            "/api/sales",
            json={
                "car_id": car.id,
                "customer_id": customer.id,
                "price": "90000.00",
                "payment_type": "bank",
            },
            headers=auth_headers(other_worker),
        )
        sale_id = created.json()["id"]

        resp = client.get(f"/api/sales/{sale_id}", headers=auth_headers(worker))

        assert resp.status_code == 403

    def test_director_sees_all_sales(self, client, db_session, director_headers, worker, customer):
        from tests.conftest import auth_headers, make_car

        car = make_car(db_session, vin="DSALE01", brand="VW", model="Passat")
        client.post(
            "/api/sales",
            json={
                "car_id": car.id,
                "customer_id": customer.id,
                "price": "120000.00",
                "payment_type": "cash",
            },
            headers=auth_headers(worker),
        )

        resp = client.get("/api/sales", headers=director_headers)

        assert resp.status_code == 200
        assert len(resp.json()) == 1


class TestCustomerDataIsolation:
    def test_customer_cannot_view_another_customers_application(
        self, client, db_session, customer, other_customer, customer_headers
    ):
        from app.models.application import Application
        from tests.conftest import make_car

        car = make_car(db_session, vin="CUSTISO01", brand="Honda", model="Civic")
        foreign_app = Application(
            customer_id=other_customer.id, car_id=car.id, phone="+998900000077", message="hi"
        )
        db_session.add(foreign_app)
        db_session.commit()
        db_session.refresh(foreign_app)

        resp = client.get(f"/api/applications/{foreign_app.id}", headers=customer_headers)

        assert resp.status_code == 403

    def test_customer_only_lists_their_own_applications(
        self, client, db_session, customer, other_customer, customer_headers
    ):
        from app.models.application import Application
        from tests.conftest import make_car

        car = make_car(db_session, vin="CUSTISO02", brand="Mazda", model="3")
        mine = Application(customer_id=customer.id, car_id=car.id, phone="+998900000076")
        theirs = Application(customer_id=other_customer.id, car_id=car.id, phone="+998900000075")
        db_session.add_all([mine, theirs])
        db_session.commit()

        resp = client.get("/api/applications", headers=customer_headers)

        assert resp.status_code == 200
        customer_ids = {a["customer_id"] for a in resp.json()}
        assert customer_ids == {customer.id}

    def test_customer_cannot_create_sale(self, client, customer_headers, car):
        resp = client.post(
            "/api/sales",
            json={
                "car_id": car.id,
                "customer_id": 999,
                "price": "100000.00",
                "payment_type": "cash",
            },
            headers=customer_headers,
        )

        assert resp.status_code == 403

    def test_customer_cannot_list_workers(self, client, customer_headers):
        assert client.get("/api/workers", headers=customer_headers).status_code == 403
    def test_customer_cannot_list_customers(self, client, customer_headers):
        """A customer must never be able to enumerate other customers."""
        assert client.get("/api/customers", headers=customer_headers).status_code == 403


class TestInactiveUserIsolation:
    def test_inactive_worker_token_is_rejected(self, client, inactive_worker_headers):
        resp = client.get("/api/cars", headers=inactive_worker_headers)

        assert resp.status_code == 403

    def test_inactive_worker_cannot_create_sale(self, client, inactive_worker_headers, car, customer):
        resp = client.post(
            "/api/sales",
            json={
                "car_id": car.id,
                "customer_id": customer.id,
                "price": "100000.00",
                "payment_type": "cash",
            },
            headers=inactive_worker_headers,
        )

        assert resp.status_code == 403


class TestTokenRobustness:
    def test_token_with_non_numeric_subject_is_unauthorized(self, client):
        token = create_access_token(data={"sub": "not-an-int", "role": "director"})

        resp = client.get("/api/cars", headers={"Authorization": f"Bearer {token}"})

        assert resp.status_code == 401

    def test_token_without_subject_claim_is_unauthorized(self, client):
        token = create_access_token(data={"role": "director"})

        resp = client.get("/api/cars", headers={"Authorization": f"Bearer {token}"})

        assert resp.status_code == 401

    def test_expired_token_is_unauthorized(self, client, director):
        token = create_access_token(
            data={"sub": str(director.id), "role": "director"},
            expires_delta=timedelta(seconds=-1),
        )

        resp = client.get("/api/cars", headers={"Authorization": f"Bearer {token}"})

        assert resp.status_code == 401

    def test_missing_authorization_header_is_unauthorized(self, client):
        assert client.get("/api/cars").status_code == 401


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _create_user(db_session, *, email: str, phone: str):
    from app.auth.security import hash_password
    from app.models.user import User, UserRole

    user = User(
        first_name="Extra",
        last_name="Worker",
        email=email,
        phone=phone,
        password_hash=hash_password("Password123!"),
        role=UserRole.worker,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
