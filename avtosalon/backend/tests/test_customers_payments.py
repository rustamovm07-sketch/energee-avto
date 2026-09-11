"""
API tests for the Customers and Payments modules.

Customers (QISM IV.7): director/worker read access, profile self-edit with
unique email/phone enforcement, and per-customer applications/sales history.

Payments (QISM IV.11): director-only statistics & lookup.
"""
from __future__ import annotations

CUSTOMERS_URL = "/api/customers"
PAYMENTS_URL = "/api/payments"


class TestCustomerListing:
    def test_director_can_list_customers(self, client, director_headers, customer):
        resp = client.get(CUSTOMERS_URL, headers=director_headers)

        assert resp.status_code == 200
        assert [c["id"] for c in resp.json()] == [customer.id]

    def test_worker_can_list_customers(self, client, worker_headers, customer):
        assert client.get(CUSTOMERS_URL, headers=worker_headers).status_code == 200

    def test_listing_returns_only_customers(self, client, director_headers, customer, worker, director):
        resp = client.get(CUSTOMERS_URL, headers=director_headers)

        assert {c["role"] for c in resp.json()} == {"customer"}

    def test_search_filters_by_name(self, client, director_headers, customer):
        resp = client.get(CUSTOMERS_URL, params={"search": "Xaridor"}, headers=director_headers)

        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_search_with_no_match_returns_empty_list(self, client, director_headers, customer):
        resp = client.get(CUSTOMERS_URL, params={"search": "ZZZ-nobody"}, headers=director_headers)

        assert resp.status_code == 200
        assert resp.json() == []

    def test_anonymous_cannot_list_customers(self, client):
        assert client.get(CUSTOMERS_URL).status_code == 401


class TestCustomerDetail:
    def test_director_can_get_customer(self, client, director_headers, customer):
        resp = client.get(f"{CUSTOMERS_URL}/{customer.id}", headers=director_headers)

        assert resp.status_code == 200
        assert resp.json()["id"] == customer.id

    def test_unknown_customer_returns_404(self, client, director_headers):
        assert client.get(f"{CUSTOMERS_URL}/999", headers=director_headers).status_code == 404

    def test_get_customer_rejects_non_customer_id(self, client, director_headers, worker):
        """A worker id passed to the customers endpoint must not resolve."""
        assert client.get(f"{CUSTOMERS_URL}/{worker.id}", headers=director_headers).status_code == 404

    def test_customer_history_endpoints_are_available_to_staff(
        self, client, director_headers, worker_headers, customer
    ):
        apps = client.get(f"{CUSTOMERS_URL}/{customer.id}/applications", headers=director_headers)
        sales = client.get(f"{CUSTOMERS_URL}/{customer.id}/sales", headers=worker_headers)

        assert apps.status_code == 200 and apps.json() == []
        assert sales.status_code == 200 and sales.json() == []

    def test_customer_cannot_read_another_customers_detail(
        self, client, customer_headers, other_customer
    ):
        resp = client.get(f"{CUSTOMERS_URL}/{other_customer.id}", headers=customer_headers)

        assert resp.status_code == 403


class TestCustomerProfileSelfEdit:
    def test_customer_can_update_own_profile(self, client, customer_headers, customer):
        resp = client.put(
            f"{CUSTOMERS_URL}/me",
            json={"first_name": "Yangi", "last_name": "Ism"},
            headers=customer_headers,
        )

        assert resp.status_code == 200
        assert resp.json()["first_name"] == "Yangi"

    def test_worker_can_update_own_profile(self, client, worker_headers, worker):
        resp = client.put(f"{CUSTOMERS_URL}/me", json={"last_name": "Ishchi"}, headers=worker_headers)

        assert resp.status_code == 200

    def test_profile_update_rejects_email_already_taken(self, client, customer_headers, other_customer):
        resp = client.put(
            f"{CUSTOMERS_URL}/me", json={"email": other_customer.email}, headers=customer_headers
        )

        assert resp.status_code == 422

    def test_profile_update_rejects_phone_already_taken(self, client, customer_headers, other_customer):
        resp = client.put(
            f"{CUSTOMERS_URL}/me", json={"phone": other_customer.phone}, headers=customer_headers
        )

        assert resp.status_code == 422

    def test_profile_update_allows_keeping_own_email(self, client, customer_headers, customer):
        resp = client.put(
            f"{CUSTOMERS_URL}/me", json={"email": customer.email}, headers=customer_headers
        )

        assert resp.status_code == 200

    def test_profile_update_requires_authentication(self, client):
        assert client.put(f"{CUSTOMERS_URL}/me", json={"first_name": "X"}).status_code == 401


class TestPayments:
    def test_director_can_list_payments_after_a_sale(
        self, client, director_headers, worker_headers, car, customer
    ):
        client.post(
            "/api/sales",
            json={
                "car_id": car.id,
                "customer_id": customer.id,
                "price": "50000.00",
                "payment_type": "cash",
            },
            headers=worker_headers,
        )

        resp = client.get(PAYMENTS_URL, headers=director_headers)

        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert str(resp.json()[0]["amount"]) == "50000.00"

    def test_director_can_get_payment_by_id(self, client, director_headers, worker_headers, car, customer):
        client.post(
            "/api/sales",
            json={
                "car_id": car.id,
                "customer_id": customer.id,
                "price": "50000.00",
                "payment_type": "bank",
            },
            headers=worker_headers,
        )
        payment_id = client.get(PAYMENTS_URL, headers=director_headers).json()[0]["id"]

        resp = client.get(f"{PAYMENTS_URL}/{payment_id}", headers=director_headers)

        assert resp.status_code == 200

    def test_unknown_payment_returns_404(self, client, director_headers):
        assert client.get(f"{PAYMENTS_URL}/999", headers=director_headers).status_code == 404

    def test_worker_cannot_list_payments(self, client, worker_headers):
        assert client.get(PAYMENTS_URL, headers=worker_headers).status_code == 403

    def test_customer_cannot_list_payments(self, client, customer_headers):
        assert client.get(PAYMENTS_URL, headers=customer_headers).status_code == 403

    def test_empty_payments_list_is_returned(self, client, director_headers):
        resp = client.get(PAYMENTS_URL, headers=director_headers)

        assert resp.status_code == 200
        assert resp.json() == []
