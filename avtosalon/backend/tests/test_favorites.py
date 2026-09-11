"""
API tests for the Favorites module (QISM III rule #15).

  * a customer can add / list / remove favorites
  * (customer_id, car_id) can never be duplicated
  * only customers may touch favorites
  * favoriting a non-existent car is a 404
"""
from __future__ import annotations

FAVORITES_URL = "/api/favorites"


class TestFavoritesPositive:
    def test_customer_can_add_favorite(self, client, customer_headers, car):
        resp = client.post(f"{FAVORITES_URL}/{car.id}", headers=customer_headers)

        assert resp.status_code == 201
        assert resp.json()["car_id"] == car.id

    def test_customer_can_list_favorites(self, client, customer_headers, car):
        client.post(f"{FAVORITES_URL}/{car.id}", headers=customer_headers)

        resp = client.get(FAVORITES_URL, headers=customer_headers)

        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]["car"]["id"] == car.id

    def test_customer_can_remove_favorite(self, client, customer_headers, car):
        client.post(f"{FAVORITES_URL}/{car.id}", headers=customer_headers)

        resp = client.delete(f"{FAVORITES_URL}/{car.id}", headers=customer_headers)

        assert resp.status_code == 204
        assert client.get(FAVORITES_URL, headers=customer_headers).json() == []

    def test_empty_favorites_list_is_not_an_error(self, client, customer_headers):
        resp = client.get(FAVORITES_URL, headers=customer_headers)

        assert resp.status_code == 200
        assert resp.json() == []


class TestFavoritesNegative:
    def test_adding_same_car_twice_does_not_create_duplicate(self, client, customer_headers, car):
        """Rule #15: (customer_id, car_id) must stay unique."""
        first = client.post(f"{FAVORITES_URL}/{car.id}", headers=customer_headers)
        second = client.post(f"{FAVORITES_URL}/{car.id}", headers=customer_headers)

        assert first.status_code == second.status_code == 201
        assert first.json()["id"] == second.json()["id"]

        listed = client.get(FAVORITES_URL, headers=customer_headers).json()
        assert len(listed) == 1

    def test_favoriting_unknown_car_returns_404(self, client, customer_headers):
        resp = client.post(f"{FAVORITES_URL}/999", headers=customer_headers)

        assert resp.status_code == 404

    def test_removing_non_favorite_returns_404(self, client, customer_headers, car):
        resp = client.delete(f"{FAVORITES_URL}/{car.id}", headers=customer_headers)

        assert resp.status_code == 404

    def test_worker_cannot_use_favorites(self, client, worker_headers, car):
        assert client.post(f"{FAVORITES_URL}/{car.id}", headers=worker_headers).status_code == 403
        assert client.get(FAVORITES_URL, headers=worker_headers).status_code == 403

    def test_director_cannot_use_favorites(self, client, director_headers, car):
        assert client.post(f"{FAVORITES_URL}/{car.id}", headers=director_headers).status_code == 403
        assert client.get(FAVORITES_URL, headers=director_headers).status_code == 403

    def test_anonymous_cannot_list_favorites(self, client):
        assert client.get(FAVORITES_URL).status_code == 401


class TestFavoritesIsolation:
    def test_customers_have_independent_favorite_lists(
        self, client, db_session, customer, other_customer, car
    ):
        from tests.conftest import auth_headers

        client.post(f"{FAVORITES_URL}/{car.id}", headers=auth_headers(customer))

        other_list = client.get(FAVORITES_URL, headers=auth_headers(other_customer))

        assert other_list.status_code == 200
        assert other_list.json() == []
