"""
Shared pytest fixtures for the backend test-suite.

Key ideas
---------
* Every test runs against a throwaway **in-memory SQLite** database, so tests
  never touch a real PostgreSQL instance and can run in any order.
* The production FastAPI dependency ``get_db`` is overridden to hand out the
  test session (SQLAlchemy ``dependency_overrides``).
* Environment variables are injected *before* ``app`` is imported because
  ``app.config.Settings`` reads them at import time and fails fast when the
  required ``DATABASE_URL`` / ``SECRET_KEY`` are missing.
"""
from __future__ import annotations

import os
import tempfile

# ---------------------------------------------------------------------------
# 1. Environment must be configured *before* importing the application, since
#    `app.config.settings` is instantiated at import time.
# ---------------------------------------------------------------------------
_TEST_DB_FD, _TEST_DB_PATH = tempfile.mkstemp(suffix=".sqlite3")
os.close(_TEST_DB_FD)

os.environ.setdefault("DATABASE_URL", f"sqlite:///{_TEST_DB_PATH}")
os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-production")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

from typing import Iterator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.auth.security import create_access_token, hash_password  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402  (imports all models onto Base.metadata)
from app.models.car import Car, CarStatus  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402


# ---------------------------------------------------------------------------
# Database fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="function")
def engine():
    """A fresh in-memory SQLite engine per test (full isolation)."""
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        # StaticPool keeps a single connection alive so the in-memory DB
        # survives for the whole test instead of disappearing per connection.
        poolclass=StaticPool,
    )

    # SQLite ignores CHECK/FK enforcement unless explicitly switched on.
    @event.listens_for(test_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _record):  # pragma: no cover
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=test_engine)
    try:
        yield test_engine
    finally:
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


@pytest.fixture(scope="function")
def db_session(engine) -> Iterator[Session]:
    """A SQLAlchemy session bound to the isolated test engine."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session: Session) -> Iterator[TestClient]:
    """
    FastAPI TestClient with ``get_db`` overridden to the test session.

    NOTE: the app's ``startup`` event (which calls ``Base.metadata.create_all``
    against the *real* engine and seeds a default director) is deliberately
    skipped — we build the schema ourselves on the SQLite engine instead.
    """

    def _override_get_db() -> Iterator[Session]:
        try:
            yield db_session
        finally:
            pass  # session lifecycle is owned by the db_session fixture

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# User / auth fixtures
# ---------------------------------------------------------------------------
DEFAULT_PASSWORD = "Password123!"


def _make_user(
    db: Session,
    *,
    email: str,
    phone: str,
    role: UserRole,
    password: str = DEFAULT_PASSWORD,
    is_active: bool = True,
    first_name: str = "Test",
    last_name: str = "User",
) -> User:
    user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        role=role,
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def director(db_session: Session) -> User:
    return _make_user(
        db_session,
        email="director@example.com",
        phone="+998900000001",
        role=UserRole.director,
        first_name="Direktor",
        last_name="Admin",
    )


@pytest.fixture
def worker(db_session: Session) -> User:
    return _make_user(
        db_session,
        email="worker@example.com",
        phone="+998900000002",
        role=UserRole.worker,
        first_name="Ishchi",
        last_name="Worker",
    )


@pytest.fixture
def inactive_worker(db_session: Session) -> User:
    return _make_user(
        db_session,
        email="inactive.worker@example.com",
        phone="+998900000003",
        role=UserRole.worker,
        is_active=False,
        first_name="Nofaol",
        last_name="Worker",
    )


@pytest.fixture
def customer(db_session: Session) -> User:
    return _make_user(
        db_session,
        email="customer@example.com",
        phone="+998900000004",
        role=UserRole.customer,
        first_name="Xaridor",
        last_name="Customer",
    )


@pytest.fixture
def other_customer(db_session: Session) -> User:
    return _make_user(
        db_session,
        email="customer2@example.com",
        phone="+998900000005",
        role=UserRole.customer,
        first_name="Boshqa",
        last_name="Xaridor",
    )


def auth_headers(user: User) -> dict[str, str]:
    """Build a real Bearer header by minting a JWT for ``user``."""
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def director_headers(director: User) -> dict[str, str]:
    return auth_headers(director)


@pytest.fixture
def worker_headers(worker: User) -> dict[str, str]:
    return auth_headers(worker)


@pytest.fixture
def customer_headers(customer: User) -> dict[str, str]:
    return auth_headers(customer)


@pytest.fixture
def inactive_worker_headers(inactive_worker: User) -> dict[str, str]:
    return auth_headers(inactive_worker)


# ---------------------------------------------------------------------------
# Domain object fixtures
# ---------------------------------------------------------------------------
def make_car(
    db: Session,
    *,
    brand: str = "Chevrolet",
    model: str = "Cobalt",
    year: int = 2022,
    price: str = "150000.00",
    vin: str = "VIN00001",
    status: CarStatus = CarStatus.available,
    mileage: int = 0,
) -> Car:
    car = Car(
        brand=brand,
        model=model,
        year=year,
        color="White",
        price=price,
        vin=vin,
        mileage=mileage,
        description="Test car",
        status=status,
    )
    db.add(car)
    db.commit()
    db.refresh(car)
    return car


@pytest.fixture
def car(db_session: Session) -> Car:
    return make_car(db_session)


@pytest.fixture
def sold_car(db_session: Session) -> Car:
    return make_car(
        db_session,
        brand="Kia",
        model="K5",
        vin="VIN00099",
        status=CarStatus.sold,
    )
