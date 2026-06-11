"""Database setup: SQLAlchemy models + engine.

Reads DATABASE_URL from Streamlit secrets first, then env. Use the same
Render Postgres URL you already provisioned for the Node backend.
"""
from __future__ import annotations

import os
from datetime import date, datetime
from typing import Optional

import streamlit as st
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    create_engine,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker


def _database_url() -> str:
    url = None
    try:
        url = st.secrets.get("DATABASE_URL")  # type: ignore[attr-defined]
    except Exception:
        url = None
    url = url or os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL not set. Add it to .streamlit/secrets.toml or env."
        )
    # SQLAlchemy prefers postgresql+psycopg2:// but accepts postgres://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and "+psycopg2" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


@st.cache_resource(show_spinner=False)
def get_engine():
    return create_engine(_database_url(), pool_pre_ping=True, pool_size=5, max_overflow=5)


@st.cache_resource(show_spinner=False)
def get_sessionmaker():
    return sessionmaker(bind=get_engine(), expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "st_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    habits: Mapped[list["Habit"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Habit(Base):
    __tablename__ = "st_habits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("st_users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False, default="custom")
    icon: Mapped[str] = mapped_column(String(8), default="✨")
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[User] = relationship(back_populates="habits")
    check_ins: Mapped[list["CheckIn"]] = relationship(back_populates="habit", cascade="all, delete-orphan")


class CheckIn(Base):
    __tablename__ = "st_check_ins"
    __table_args__ = (UniqueConstraint("habit_id", "check_date", name="uq_habit_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    habit_id: Mapped[int] = mapped_column(ForeignKey("st_habits.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("st_users.id", ondelete="CASCADE"), index=True)
    check_date: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    habit: Mapped[Habit] = relationship(back_populates="check_ins")


def init_db() -> None:
    """Create tables if they don't exist. Safe to call on every app start."""
    Base.metadata.create_all(get_engine())
