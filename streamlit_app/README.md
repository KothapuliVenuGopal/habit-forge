# HabitForge — Streamlit MVP

Minimal habit-tracking app: email/password auth, habits CRUD, daily check-ins, streak tracking, 120-day history heatmap. Backed by your existing Render PostgreSQL database.

## Features
- Email + password auth (bcrypt-hashed)
- Habits with categories (coding, reading, gym, running, meditation, fasting, custom)
- Manual daily check-ins with optional notes
- Current streak, longest streak, total check-ins
- 120-day contribution-style history grid

## Run locally

```bash
cd streamlit_app
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Provide your Render Postgres connection string
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
# edit .streamlit/secrets.toml and paste your DATABASE_URL

streamlit run app.py
```

The app auto-creates its tables (`st_users`, `st_habits`, `st_check_ins`) on first run. They are prefixed with `st_` so they coexist safely with the old Node backend tables if you keep them around.

## Deploy to Streamlit Community Cloud

1. Push this repo to GitHub.
2. Go to https://share.streamlit.io → **New app**.
3. Select the repo, branch, and set **Main file path** to `streamlit_app/app.py`.
4. Under **Advanced settings → Secrets**, paste:
   ```
   DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DBNAME"
   ```
   (Use your Render External Database URL — make sure the Render DB allows external connections.)
5. Click **Deploy**. First boot will create the tables automatically.

## Files
- `app.py` — main UI + routing
- `auth.py` — signup / login / logout (bcrypt)
- `db.py` — SQLAlchemy engine + ORM models
- `streaks.py` — streak math
- `requirements.txt` — Python deps
- `.streamlit/config.toml` — dark theme
- `.streamlit/secrets.toml.example` — secrets template

## Removing the old stack

Once you're happy with the Streamlit app you can delete the unused folders from the repo root:

- `src/`, `public/`, `supabase/`, `backend/`
- `package.json`, `bun.lock`, `vite.config.ts`, `tsconfig.json`, `components.json`, `eslint.config.js`, `render.yaml`

I left them in place so the Lovable preview keeps working while you transition.
