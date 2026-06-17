# ConsiTrack — Django Edition

Production-ready scaffold of the ConsiTrack SaaS in Django + Channels + MySQL.

## Stack
- **Backend**: Django 5, Django REST Framework, Django Channels (WebSockets)
- **DB**: MySQL (via `DATABASE_URL`)
- **Realtime**: Channels + Redis
- **AI**: OpenAI GPT-4o or Gemini 2.5 Pro (configure `OPENAI_API_KEY` or `GEMINI_API_KEY`)
- **Frontend**: Django templates + Tailwind (CDN) + vanilla JS
- **Auth**: Email + Google OAuth (django-allauth)
- **Deploy**: Render (web service + Redis + MySQL)

## Apps
- `accounts` — users, profiles, auth, friend requests, blocks
- `habits` — habits, categories (default + custom), CRUD with optimistic UI
- `checkins` — per-category AI-verified check-ins, statuses, scores
- `credits` — category-scoped Bond Credits, transactions
- `shields` — Bronze/Silver/Gold marketplace, activation, expiry
- `clubs` — 7/30/100/365-day clubs, membership, feed, leaderboards, weekly champions
- `chat` — club chat, global community, DMs, WebSocket consumers
- `mentorship` — request/accept, mentor rooms, mentor badge
- `rewards` — marketplace, AI resume builder, redemptions
- `badges` — achievements with rarity (Common/Rare/Epic/Legendary)
- `core` — landing, dashboard, legal pages, admin extras

## Local setup
```bash
cd django_app
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill DATABASE_URL, REDIS_URL, secret keys
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

For WebSockets locally:
```bash
daphne -b 0.0.0.0 -p 8000 consitrack.asgi:application
```

## Render deployment
See `render.yaml` at repo root. Required env vars:
- `DATABASE_URL` — `mysql://user:pass@host:3306/db`
- `REDIS_URL` — `redis://...`
- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS` — e.g. `consitrack.onrender.com`
- `OPENAI_API_KEY` or `GEMINI_API_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` (optional)

After first deploy:
```bash
python manage.py migrate
python manage.py seed_defaults   # seeds default categories + badges
```
