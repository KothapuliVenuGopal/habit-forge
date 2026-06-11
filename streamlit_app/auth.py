"""Email/password auth using bcrypt + Streamlit session state."""
from __future__ import annotations

import bcrypt
import streamlit as st
from sqlalchemy import select

from db import User, get_sessionmaker


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def signup(email: str, password: str, display_name: str) -> tuple[bool, str]:
    email = email.strip().lower()
    if not email or "@" not in email:
        return False, "Enter a valid email."
    if len(password) < 8:
        return False, "Password must be at least 8 characters."
    if not display_name.strip():
        return False, "Display name is required."

    Session = get_sessionmaker()
    with Session() as s:
        existing = s.scalar(select(User).where(User.email == email))
        if existing:
            return False, "An account with that email already exists."
        user = User(email=email, password_hash=_hash(password), display_name=display_name.strip())
        s.add(user)
        s.commit()
        st.session_state["user_id"] = user.id
        st.session_state["display_name"] = user.display_name
    return True, "Account created."


def login(email: str, password: str) -> tuple[bool, str]:
    email = email.strip().lower()
    Session = get_sessionmaker()
    with Session() as s:
        user = s.scalar(select(User).where(User.email == email))
        if not user or not _verify(password, user.password_hash):
            return False, "Invalid email or password."
        st.session_state["user_id"] = user.id
        st.session_state["display_name"] = user.display_name
    return True, "Logged in."


def logout() -> None:
    for k in ("user_id", "display_name"):
        st.session_state.pop(k, None)


def current_user_id() -> int | None:
    return st.session_state.get("user_id")
