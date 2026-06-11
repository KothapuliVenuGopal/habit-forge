"""Streamlit MVP: habits + manual check-ins + streak tracking.

Run locally:
    cd streamlit_app
    pip install -r requirements.txt
    cp .streamlit/secrets.toml.example .streamlit/secrets.toml  # fill in DATABASE_URL
    streamlit run app.py
"""
from __future__ import annotations

from datetime import date, timedelta

import pandas as pd
import streamlit as st
from sqlalchemy import select

from auth import current_user_id, login, logout, signup
from db import CheckIn, Habit, get_sessionmaker, init_db
from streaks import current_streak, longest_streak

st.set_page_config(page_title="HabitForge", page_icon="🔥", layout="wide")

# Initialize DB schema once per process
if not st.session_state.get("_db_ready"):
    try:
        init_db()
        st.session_state["_db_ready"] = True
    except Exception as e:
        st.error(f"Database connection failed: {e}")
        st.stop()

CATEGORIES = {
    "coding": "💻",
    "reading": "📚",
    "gym": "🏋️",
    "running": "🏃",
    "meditation": "🧘",
    "fasting": "⏱️",
    "custom": "✨",
}


# ---------------- Auth screens ----------------

def render_auth() -> None:
    st.title("🔥 HabitForge")
    st.caption("Build streaks. Track habits. Stay accountable.")

    tab_login, tab_signup = st.tabs(["Log in", "Sign up"])

    with tab_login:
        with st.form("login_form"):
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_pw")
            submitted = st.form_submit_button("Log in", use_container_width=True)
            if submitted:
                ok, msg = login(email, password)
                if ok:
                    st.rerun()
                else:
                    st.error(msg)

    with tab_signup:
        with st.form("signup_form"):
            display_name = st.text_input("Display name")
            email = st.text_input("Email", key="signup_email")
            password = st.text_input("Password (min 8 chars)", type="password", key="signup_pw")
            submitted = st.form_submit_button("Create account", use_container_width=True)
            if submitted:
                ok, msg = signup(email, password, display_name)
                if ok:
                    st.rerun()
                else:
                    st.error(msg)


# ---------------- Data helpers ----------------

def list_habits(user_id: int) -> list[Habit]:
    Session = get_sessionmaker()
    with Session() as s:
        return list(
            s.scalars(
                select(Habit)
                .where(Habit.user_id == user_id, Habit.archived == False)  # noqa: E712
                .order_by(Habit.created_at.asc())
            )
        )


def habit_dates(user_id: int, habit_id: int) -> list[date]:
    Session = get_sessionmaker()
    with Session() as s:
        rows = s.scalars(
            select(CheckIn.check_date).where(
                CheckIn.user_id == user_id, CheckIn.habit_id == habit_id
            )
        ).all()
    return list(rows)


def create_habit(user_id: int, name: str, category: str) -> None:
    Session = get_sessionmaker()
    with Session() as s:
        s.add(
            Habit(
                user_id=user_id,
                name=name.strip(),
                category=category,
                icon=CATEGORIES.get(category, "✨"),
            )
        )
        s.commit()


def archive_habit(user_id: int, habit_id: int) -> None:
    Session = get_sessionmaker()
    with Session() as s:
        h = s.get(Habit, habit_id)
        if h and h.user_id == user_id:
            h.archived = True
            s.commit()


def check_in(user_id: int, habit_id: int, on: date, note: str | None) -> tuple[bool, str]:
    Session = get_sessionmaker()
    with Session() as s:
        existing = s.scalar(
            select(CheckIn).where(CheckIn.habit_id == habit_id, CheckIn.check_date == on)
        )
        if existing:
            return False, "Already checked in for that day."
        s.add(CheckIn(habit_id=habit_id, user_id=user_id, check_date=on, note=(note or None)))
        s.commit()
    return True, "Checked in ✅"


# ---------------- App ----------------

def render_sidebar() -> None:
    with st.sidebar:
        st.markdown(f"### 👤 {st.session_state.get('display_name', 'You')}")
        st.divider()
        page = st.radio(
            "Navigate",
            ["Dashboard", "Habits", "History"],
            label_visibility="collapsed",
        )
        st.session_state["page"] = page
        st.divider()
        if st.button("Log out", use_container_width=True):
            logout()
            st.rerun()


def render_dashboard(user_id: int) -> None:
    st.title("Dashboard")
    habits = list_habits(user_id)
    if not habits:
        st.info("No habits yet. Head to **Habits** to create your first one.")
        return

    today = date.today()
    cols = st.columns(min(len(habits), 3) or 1)
    for i, h in enumerate(habits):
        dates = habit_dates(user_id, h.id)
        cs = current_streak(dates, today)
        ls = longest_streak(dates)
        with cols[i % len(cols)]:
            with st.container(border=True):
                st.markdown(f"### {h.icon} {h.name}")
                st.caption(h.category.capitalize())
                m1, m2, m3 = st.columns(3)
                m1.metric("Current", f"{cs}d")
                m2.metric("Longest", f"{ls}d")
                m3.metric("Total", f"{len(dates)}")
                already = today in set(dates)
                with st.popover(
                    "✓ Checked in today" if already else "Check in today",
                    disabled=already,
                    use_container_width=True,
                ):
                    note = st.text_area(
                        "Note (optional)", key=f"note_{h.id}", max_chars=500
                    )
                    if st.button("Submit", key=f"submit_{h.id}", use_container_width=True):
                        ok, msg = check_in(user_id, h.id, today, note)
                        (st.success if ok else st.error)(msg)
                        if ok:
                            st.rerun()


def render_habits(user_id: int) -> None:
    st.title("Habits")

    with st.expander("➕ New habit", expanded=False):
        with st.form("new_habit"):
            name = st.text_input("Name", max_chars=80)
            category = st.selectbox("Category", list(CATEGORIES.keys()))
            if st.form_submit_button("Create", use_container_width=True):
                if not name.strip():
                    st.error("Name is required.")
                else:
                    create_habit(user_id, name, category)
                    st.success("Habit created.")
                    st.rerun()

    habits = list_habits(user_id)
    if not habits:
        st.info("No habits yet.")
        return

    for h in habits:
        with st.container(border=True):
            c1, c2 = st.columns([5, 1])
            with c1:
                st.markdown(f"### {h.icon} {h.name}")
                st.caption(f"{h.category.capitalize()} · created {h.created_at:%b %d, %Y}")
            with c2:
                if st.button("Archive", key=f"arch_{h.id}", use_container_width=True):
                    archive_habit(user_id, h.id)
                    st.rerun()


def render_history(user_id: int) -> None:
    st.title("History")
    habits = list_habits(user_id)
    if not habits:
        st.info("No habits to show.")
        return

    habit = st.selectbox("Habit", habits, format_func=lambda h: f"{h.icon} {h.name}")
    dates = habit_dates(user_id, habit.id)
    if not dates:
        st.info("No check-ins yet.")
        return

    today = date.today()
    start = today - timedelta(days=119)  # ~17 weeks
    date_set = set(dates)
    grid = []
    cursor = start
    while cursor <= today:
        grid.append({"date": cursor, "checked": 1 if cursor in date_set else 0})
        cursor += timedelta(days=1)
    df = pd.DataFrame(grid)
    df["week"] = df["date"].apply(lambda d: (d - start).days // 7)
    df["weekday"] = df["date"].apply(lambda d: d.weekday())
    pivot = df.pivot(index="weekday", columns="week", values="checked").fillna(0)

    st.markdown("#### Last 120 days")
    st.dataframe(
        pivot.style.background_gradient(cmap="Greens", vmin=0, vmax=1),
        use_container_width=True,
        height=260,
    )

    st.markdown("#### Recent check-ins")
    recent = sorted(dates, reverse=True)[:30]
    st.table(pd.DataFrame({"Date": recent}))


def main() -> None:
    if current_user_id() is None:
        render_auth()
        return

    render_sidebar()
    user_id = current_user_id()
    page = st.session_state.get("page", "Dashboard")
    if page == "Dashboard":
        render_dashboard(user_id)
    elif page == "Habits":
        render_habits(user_id)
    elif page == "History":
        render_history(user_id)


if __name__ == "__main__":
    main()
