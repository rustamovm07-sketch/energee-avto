"""
API tests for the Dashboard module.

Verifies that statistics are computed from real database rows (the spec
forbids fake/static dashboard data) and that access is director-only.
"""
from __future__ import annotations

import pytest

DASHBOARD_URL = "/api/dashboard/stats"
SALES_URL = "/api/sales"


class TestDashboardAccess:
    def test_director_can_read_stats(self, client, director_headers):
        assert client.get(DASHBOARD_URL, headers=director_headers).status_code == 200

    def test_worker_is_forbidden(self, client, worker_headers):
        assert client.get(DASHBOARD_URL, headers=worker_headers).status_code == 403

    def test_customer_is_forbidden(self, client, customer_headers):
        assert client.get(DASHBOARD_URL, headers=customer_headers).status_code == 403

    def test_anonymous_is_unauthorized(self, client):
        assert client.get(DASHBOARD_URL).status_code == 401


class TestDashboardComputation:
    def test_all_counters_start_at_zero(self, client, director_headers):
        """`director` fixture exists, so workers/customers/sales must be 0."""
        body = client.get(DASHBOARD_URL, headers=director_headers).json()

        assert body["total_cars"] == 0
        assert body["available_cars"] == 0
        assert body["sold_cars"] == 0
        assert body["total_customers"] == 0
        assert body["total_workers"] == 0
        assert body["total_sales"] == 0
        assert float(body["total_revenue"]) == 0.0

    def test_car_counters_reflect_the_database(self, client, db_session, director_headers, car, sold_car):
        body = client.get(DASHBOARD_URL, headers=director_headers).json()

        assert body["total_cars"] == 2
        assert body["available_cars"] == 1
        assert body["sold_cars"] == 1

    def test_user_counters_reflect_roles(self, client, director_headers, worker, customer):
        body = client.get(DASHBOARD_URL, headers=director_headers).json()

        assert body["total_workers"] == 1
        assert body["total_customers"] == 1

    def test_sales_and_revenue_are_aggregated_from_payments(
        self, client, director_headers, worker_headers, car, customer
    ):
        client.post(
            SALES_URL,
            json={
                "car_id": car.id,
                "customer_id": customer.id,
                "price": "200000.00",
                "payment_type": "card",
            },
            headers=worker_headers,
        )

        body = client.get(DASHBOARD_URL, headers=director_headers).json()

        assert body["total_sales"] == 1
        assert float(body["total_revenue"]) == 200000.0
        assert len(body["recent_sales"]) == 1

    def test_recent_sales_is_capped_at_ten(
        self, client, db_session, director_headers, worker_headers, customer
    ):
        from tests.conftest import make_car

        for i in range(12):
            car = make_car(db_session, vin=f"RECENT{i:02d}", brand="B", model="M")
            client.post(
                SALES_URL,
                json={
                    "car_id": car.id,
                    "customer_id": customer.id,
                    "price": "1000.00",
                    "payment_type": "cash",
                },
                headers=worker_headers,
            )

        body = client.get(DASHBOARD_URL, headers=director_headers).json()

        assert body["total_sales"] == 12
        assert len(body["recent_sales"]) == 10
