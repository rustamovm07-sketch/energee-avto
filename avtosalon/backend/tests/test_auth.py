"""
Unit / API tests for authentication (QISM II & VII of the master spec).

Covered:
  * public customer registration (success, duplicate email, duplicate phone,
    password mismatch, weak password, invalid email)
  * login by email OR phone (success, wrong password, unknown user)
  * inactive user cannot authenticate
  * /api/auth/me (valid, missing, malformed, expired, forged token)
  * change-password flow
  * low-level JWT + password-hashing helpers
"""
from __future__ import annotations

from datetime import timedelta

import pytest

from app.auth.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
ME_URL = "/api/auth/me"
CHANGE_PW_URL = "/api/auth/change-password"


def _register_payload(**overrides) -> dict:
    payload = {
        "first_name": "Ali",
        "last_name": "Valiyev",
        "phone": "+998901112233",
        "email": "ali@example.com",
        "password": "StrongPass1",
        "password_confirm": "StrongPass1",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Registration - positive
# ---------------------------------------------------------------------------
class TestRegisterPositive:
    def test_register_customer_success(self, client, db_session):
        resp = client.post(REGISTER_URL, json=_register_payload())

        assert resp.status_code == 201
        body = resp.json()
        assert body["email"] == "ali@example.com"
        assert body["role"] == UserRole.customer.value
        assert body["is_active"] is True
        # password must never leak back to the client
        assert "password" not in body
        assert "password_hash" not in body

        stored = db_session.query(User).filter(User.email == "ali@example.com").first()
        assert stored is not None
        assert stored.password_hash != "StrongPass1"  # hashed, not plain text

    def test_public_registration_always_forces_customer_role(self, client, db_session):
        """A malicious client must not be able to self-assign director/worker."""
        resp = client.post(REGISTER_URL, json=_register_payload(role="director"))

        assert resp.status_code == 201
        assert resp.json()["role"] == UserRole.customer.value


# ---------------------------------------------------------------------------
# Registration - negative & edge cases
# ---------------------------------------------------------------------------
class TestRegisterNegative:
    def test_duplicate_email_is_rejected(self, client, customer):
        resp = client.post(REGISTER_URL, json=_register_payload(email=customer.email))

        assert resp.status_code == 422
        assert "email" in resp.json()["detail"].lower()

    def test_duplicate_phone_is_rejected(self, client, customer):
        resp = client.post(
            REGISTER_URL,
            json=_register_payload(email="brand.new@example.com", phone=customer.phone),
        )

        assert resp.status_code == 422
        assert "phone" in resp.json()["detail"].lower()

    def test_password_mismatch_is_rejected(self, client):
        resp = client.post(
            REGISTER_URL,
            json=_register_payload(password="StrongPass1", password_confirm="Different1"),
        )

        assert resp.status_code == 422
        assert "match" in str(resp.json()).lower()

    def test_short_password_is_rejected(self, client):
        resp = client.post(
            REGISTER_URL,
            json=_register_payload(password="123", password_confirm="123"),
        )

        assert resp.status_code == 422

    def test_invalid_email_format_is_rejected(self, client):
        resp = client.post(REGISTER_URL, json=_register_payload(email="not-an-email"))

        assert resp.status_code == 422

    @pytest.mark.parametrize("missing_field", ["first_name", "last_name", "phone", "email", "password"])
    def test_missing_required_field_is_rejected(self, client, missing_field):
        payload = _register_payload()
        payload.pop(missing_field)

        resp = client.post(REGISTER_URL, json=payload)

        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
class TestLoginPositive:
    def test_login_with_email_success(self, client, customer):
        resp = client.post(LOGIN_URL, json={"identifier": customer.email, "password": "Password123!"})

        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body and body["access_token"]
        assert body["token_type"] == "bearer"
        assert body["user"]["id"] == customer.id
        assert body["user"]["role"] == UserRole.customer.value

    def test_login_with_phone_success(self, client, worker):
        resp = client.post(LOGIN_URL, json={"identifier": worker.phone, "password": "Password123!"})

        assert resp.status_code == 200
        assert resp.json()["user"]["id"] == worker.id

    def test_login_by_customer_returns_valid_token_usable_on_me(self, client, customer):
        token = client.post(
            LOGIN_URL, json={"identifier": customer.email, "password": "Password123!"}
        ).json()["access_token"]

        me = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})

        assert me.status_code == 200
        assert me.json()["email"] == customer.email


class TestLoginNegative:
    def test_wrong_password_is_rejected(self, client, customer):
        resp = client.post(LOGIN_URL, json={"identifier": customer.email, "password": "WrongPass1"})

        assert resp.status_code == 401

    def test_unknown_identifier_is_rejected(self, client):
        resp = client.post(LOGIN_URL, json={"identifier": "ghost@example.com", "password": "Whatever1"})

        assert resp.status_code == 401

    def test_error_message_does_not_reveal_whether_account_exists(self, client, customer):
        """Security requirement: auth errors must be generic."""
        wrong_pw = client.post(LOGIN_URL, json={"identifier": customer.email, "password": "Nope12345"})
        unknown = client.post(LOGIN_URL, json={"identifier": "ghost@example.com", "password": "Nope12345"})

        assert wrong_pw.status_code == unknown.status_code == 401
        assert wrong_pw.json()["detail"] == unknown.json()["detail"]

    def test_inactive_worker_cannot_login(self, client, inactive_worker):
        resp = client.post(
            LOGIN_URL,
            json={"identifier": inactive_worker.email, "password": "Password123!"},
        )

        assert resp.status_code == 403
        assert "deactivated" in resp.json()["detail"].lower()

    def test_missing_password_field_is_rejected(self, client, customer):
        resp = client.post(LOGIN_URL, json={"identifier": customer.email})

        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# /api/auth/me - token handling
# ---------------------------------------------------------------------------
class TestCurrentUserEndpoint:
    def test_get_me_without_token_is_unauthorized(self, client):
        assert client.get(ME_URL).status_code == 401

    def test_get_me_with_malformed_token_is_unauthorized(self, client):
        resp = client.get(ME_URL, headers={"Authorization": "Bearer not.a.real.token"})

        assert resp.status_code == 401

    def test_get_me_with_forged_token_is_unauthorized(self, client):
        """Signature check must reject a token signed with a different key."""
        from jose import jwt

        forged = jwt.encode({"sub": "1", "role": "director"}, "attacker-key", algorithm="HS256")
        resp = client.get(ME_URL, headers={"Authorization": f"Bearer {forged}"})

        assert resp.status_code == 401

    def test_get_me_with_expired_token_is_unauthorized(self, client, director):
        expired = create_access_token(
            data={"sub": str(director.id), "role": director.role.value},
            expires_delta=timedelta(minutes=-5),
        )
        resp = client.get(ME_URL, headers={"Authorization": f"Bearer {expired}"})

        assert resp.status_code == 401

    def test_get_me_with_token_of_deleted_user_is_unauthorized(self, client, db_session, customer):
        from tests.conftest import auth_headers

        headers = auth_headers(customer)
        db_session.delete(customer)
        db_session.commit()

        resp = client.get(ME_URL, headers=headers)

        assert resp.status_code == 401

    def test_get_me_for_deactivated_user_is_forbidden(self, client, db_session, worker):
        from tests.conftest import auth_headers

        headers = auth_headers(worker)
        worker.is_active = False
        db_session.commit()

        resp = client.get(ME_URL, headers=headers)

        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Change password
# ---------------------------------------------------------------------------
class TestChangePassword:
    def test_change_password_success_then_login_with_new_password(self, client, customer):
        resp = client.post(
            CHANGE_PW_URL,
            json={
                "old_password": "Password123!",
                "new_password": "BrandNew123",
                "new_password_confirm": "BrandNew123",
            },
            headers={"Authorization": _bearer(customer)},
        )

        assert resp.status_code == 200
        assert client.post(
            LOGIN_URL, json={"identifier": customer.email, "password": "BrandNew123"}
        ).status_code == 200
        assert client.post(
            LOGIN_URL, json={"identifier": customer.email, "password": "Password123!"}
        ).status_code == 401

    def test_change_password_wrong_old_password_is_rejected(self, client, customer):
        resp = client.post(
            CHANGE_PW_URL,
            json={
                "old_password": "TotallyWrong",
                "new_password": "BrandNew123",
                "new_password_confirm": "BrandNew123",
            },
            headers={"Authorization": _bearer(customer)},
        )

        assert resp.status_code == 401

    def test_change_password_confirmation_mismatch_is_rejected(self, client, customer):
        resp = client.post(
            CHANGE_PW_URL,
            json={
                "old_password": "Password123!",
                "new_password": "BrandNew123",
                "new_password_confirm": "Mismatch123",
            },
            headers={"Authorization": _bearer(customer)},
        )

        assert resp.status_code == 422

    def test_change_password_requires_authentication(self, client):
        resp = client.post(
            CHANGE_PW_URL,
            json={
                "old_password": "Password123!",
                "new_password": "BrandNew123",
                "new_password_confirm": "BrandNew123",
            },
        )

        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Low-level security helpers
# ---------------------------------------------------------------------------
class TestSecurityHelpers:
    def test_hash_password_is_not_reversible_to_plain_text(self):
        hashed = hash_password("Secret123!")

        assert hashed != "Secret123!"
        assert hashed.startswith("$2")  # bcrypt marker

    def test_hash_password_produces_unique_salts(self):
        assert hash_password("Same123!") != hash_password("Same123!")

    def test_verify_password_true_for_correct_password(self):
        assert verify_password("Secret123!", hash_password("Secret123!")) is True

    def test_verify_password_false_for_incorrect_password(self):
        assert verify_password("Wrong123!", hash_password("Secret123!")) is False

    def test_verify_password_false_for_empty_password(self):
        assert verify_password("", hash_password("Secret123!")) is False

    def test_create_access_token_roundtrips_payload(self):
        token = create_access_token(data={"sub": "42", "role": "worker"})

        payload = decode_access_token(token)

        assert payload is not None
        assert payload["sub"] == "42"
        assert payload["role"] == "worker"
        assert "exp" in payload

    def test_create_access_token_respects_custom_expiry(self):
        token = create_access_token(data={"sub": "1"}, expires_delta=timedelta(minutes=-1))

        assert decode_access_token(token) is None  # already expired

    def test_decode_access_token_returns_none_for_garbage(self):
        assert decode_access_token("garbage-token") is None

    def test_decode_access_token_returns_none_for_foreign_signature(self):
        from jose import jwt

        foreign = jwt.encode({"sub": "1"}, "another-secret", algorithm="HS256")

        assert decode_access_token(foreign) is None


def _bearer(user: User) -> str:
    return f"Bearer {create_access_token(data={'sub': str(user.id), 'role': user.role.value})}"
