from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, SessionLocal
from app import models  # noqa: F401 - ensures all models are registered on Base.metadata
from app.models.user import User, UserRole
from app.auth.security import hash_password

from app.routers import auth, cars, customers, workers, applications, sales, payments, favorites, dashboard

app = FastAPI(
    title="Avtosalon Management System API",
    description="V1 - core dealership management API (auth, cars, applications, sales, payments, favorites)",
    version="1.0.1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cars.router)
app.include_router(customers.router)
app.include_router(workers.router)
app.include_router(applications.router)
app.include_router(sales.router)
app.include_router(payments.router)
app.include_router(favorites.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


def _ensure_default_director(db: Session) -> None:
    """
    Creates a default director account on first run, so there's always a
    way to log in and start using the system. Safe to run every startup -
    it's a no-op once a director already exists.
    """
    director_exists = db.query(User).filter(User.role == UserRole.director).first()
    if director_exists:
        return

    default_director = User(
        first_name="Admin",
        last_name="Director",
        phone="999999999",
        email="director@gmail.com",
        password_hash=hash_password("999999999"),
        role=UserRole.director,
        is_active=True,
    )
    db.add(default_director)
    db.commit()


@app.on_event("startup")
def on_startup():
    # For V1 simplicity we auto-create tables if they don't exist yet.
    # In a real deployment, prefer Alembic migrations (see backend/README.md).
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        _ensure_default_director(db)
    finally:
        db.close()
