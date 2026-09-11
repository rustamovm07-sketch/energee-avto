import enum

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class UserRole(str, enum.Enum):
    director = "director"
    worker = "worker"
    customer = "customer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(30), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.customer)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships - a user can appear in many capacities depending on role
    applications_as_customer = relationship(
        "Application", foreign_keys="Application.customer_id", back_populates="customer"
    )
    applications_as_worker = relationship(
        "Application", foreign_keys="Application.worker_id", back_populates="worker"
    )
    sales_as_customer = relationship(
        "Sale", foreign_keys="Sale.customer_id", back_populates="customer"
    )
    sales_as_worker = relationship(
        "Sale", foreign_keys="Sale.worker_id", back_populates="worker"
    )
    favorites = relationship("Favorite", back_populates="customer", cascade="all, delete-orphan")
