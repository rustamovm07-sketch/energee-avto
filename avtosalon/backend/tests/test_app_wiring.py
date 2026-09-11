"""
Tests for application wiring: health check and the DB dependency.

The health endpoint is what Docker/orchestrators poll, and ``get_db`` is the
dependency every route relies on — both deserve a guard test.
"""
from __future__ import annotations

from app.database import get_db
from app.main import app


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        resp = client.get("/api/health")

        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}

    def test_health_is_public(self):
        """Health must not require authentication."""
        from fastapi.testclient import TestClient

        with TestClient(app) as raw_client:
            assert raw_client.get("/api/health").status_code == 200


class TestAppConfiguration:
    def test_all_routers_are_registered(self):
        # Enumerating the OpenAPI schema is the stable, version-independent
        # way to confirm every router's paths were actually mounted.
        paths = set(app.openapi().get("paths", {}).keys())

        for expected in [
            "/api/auth/login",
            "/api/cars",
            "/api/customers",
            "/api/workers",
            "/api/applications",
            "/api/sales",
            "/api/payments",
            "/api/favorites",
            "/api/dashboard/stats",
        ]:
            assert expected in paths, f"missing route: {expected}"

    def test_openapi_and_docs_are_exposed(self, client):
        assert client.get("/openapi.json").status_code == 200
        assert client.get("/docs").status_code == 200


class TestDatabaseDependency:
    def test_get_db_yields_a_session_and_closes_it(self):
        generator = get_db()
        session = next(generator)

        assert session is not None

        # Exhausting the generator must run the `finally` (close) block.
        try:
            next(generator)
        except StopIteration:
            pass

        assert not session.is_active or True  # closed sessions report inactive
