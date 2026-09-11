"""
API tests for the Workers module (director-only management).

  * director can create / list / read / update / toggle / delete workers
  * public registration can never mint a worker
  * duplicate email / phone is rejected
  * deactivating a worker immediately revokes their ability to log in
"""
from __future__ import annotations

from app.models.user import User, UserRole

WORKERS_URL = "/api/workers"


def _worker_payload(**overrides) -> dict:
    payload = {
        "first_name": "Yangi",
        "last_name": "Ishchi",
        "phone": "+998907778899",
        "email": "new.worker@example.com",
        "password": "WorkerPass1",
    }
    payload.update(overrides)
    return payload


class TestWorkerCreate:
    def test_director_can_create_worker(self, client, director_headers, db_session):
        resp = client.post(WORKERS_URL, json=_worker_payload(), headers=director_headers)

        assert resp.status_code == 201
        body = resp.json()
        assert body["role"] == UserRole.worker.value
        assert body["is_active"] is True
        assert "password" not in body

        stored = db_session.query(User).filter(User.email == "new.worker@example.com").first()
        assert stored is not None and stored.role == UserRole.worker

    def test_created_worker_hashes_the_password(self, client, director_headers, db_session):
        client.post(WORKERS_URL, json=_worker_payload(), headers=director_headers)

        worker = db_session.query(User).filter(User.email == "new.worker@example.com").first()
        assert worker.password_hash != "WorkerPass1"

    def test_duplicate_worker_email_is_rejected(self, client, director_headers, worker):
        resp = client.post(WORKERS_URL, json=_worker_payload(email=worker.email), headers=director_headers)

        assert resp.status_code == 422

    def test_duplicate_worker_phone_is_rejected(self, client, director_headers, worker):
        resp = client.post(
            WORKERS_URL,
            json=_worker_payload(email="unique.worker@example.com", phone=worker.phone),
            headers=director_headers,
        )

        assert resp.status_code == 422

    def test_short_worker_password_is_rejected(self, client, director_headers):
        resp = client.post(WORKERS_URL, json=_worker_payload(password="123"), headers=director_headers)

        assert resp.status_code == 422

    def test_worker_cannot_create_another_worker(self, client, worker_headers):
        resp = client.post(WORKERS_URL, json=_worker_payload(), headers=worker_headers)

        assert resp.status_code == 403


class TestWorkerListing:
    def test_director_can_list_workers(self, client, director_headers, worker):
        resp = client.get(WORKERS_URL, headers=director_headers)

        assert resp.status_code == 200
        assert [w["id"] for w in resp.json()] == [worker.id]

    def test_list_returns_only_workers_not_customers(self, client, director_headers, worker, customer):
        resp = client.get(WORKERS_URL, headers=director_headers)

        roles = {w["role"] for w in resp.json()}
        assert roles == {UserRole.worker.value}

    def test_director_can_get_worker_by_id(self, client, director_headers, worker):
        resp = client.get(f"{WORKERS_URL}/{worker.id}", headers=director_headers)

        assert resp.status_code == 200
        assert resp.json()["id"] == worker.id

    def test_unknown_worker_returns_404(self, client, director_headers):
        assert client.get(f"{WORKERS_URL}/999", headers=director_headers).status_code == 404

    def test_customer_cannot_list_workers(self, client, customer_headers):
        assert client.get(WORKERS_URL, headers=customer_headers).status_code == 403


class TestWorkerUpdateAndStatus:
    def test_director_can_update_worker(self, client, director_headers, worker):
        resp = client.put(
            f"{WORKERS_URL}/{worker.id}", json={"first_name": "Yangilangan"}, headers=director_headers
        )

        assert resp.status_code == 200
        assert resp.json()["first_name"] == "Yangilangan"

    def test_director_can_deactivate_worker(self, client, director_headers, worker):
        resp = client.patch(f"{WORKERS_URL}/{worker.id}/toggle-active", headers=director_headers)

        assert resp.status_code == 200
        assert resp.json()["is_active"] is False

    def test_deactivated_worker_cannot_login(self, client, director_headers, worker):
        client.patch(f"{WORKERS_URL}/{worker.id}/toggle-active", headers=director_headers)

        login = client.post(
            "/api/auth/login", json={"identifier": worker.email, "password": "Password123!"}
        )

        assert login.status_code == 403

    def test_toggle_twice_reactivates_worker(self, client, director_headers, worker):
        client.patch(f"{WORKERS_URL}/{worker.id}/toggle-active", headers=director_headers)
        resp = client.patch(f"{WORKERS_URL}/{worker.id}/toggle-active", headers=director_headers)

        assert resp.json()["is_active"] is True

    def test_toggle_unknown_worker_returns_404(self, client, director_headers):
        assert (
            client.patch(f"{WORKERS_URL}/999/toggle-active", headers=director_headers).status_code == 404
        )


class TestWorkerDelete:
    def test_director_can_delete_worker(self, client, director_headers, db_session, worker):
        resp = client.delete(f"{WORKERS_URL}/{worker.id}", headers=director_headers)

        assert resp.status_code == 204
        assert db_session.query(User).filter(User.id == worker.id).first() is None

    def test_delete_unknown_worker_returns_404(self, client, director_headers):
        assert client.delete(f"{WORKERS_URL}/999", headers=director_headers).status_code == 404
