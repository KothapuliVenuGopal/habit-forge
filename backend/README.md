# ConsiTrack Backend

Express + Prisma + PostgreSQL + Socket.IO API for ConsiTrack.

## Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **ORM**: Prisma 5 (PostgreSQL)
- **Auth**: JWT (email/password + Google OAuth)
- **Realtime**: Socket.IO (chat, DMs, friend events, mentorship)
- **AI**: Lovable AI Gateway (Gemini) for habit verification — falls back to heuristic if no key

## Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/google              -> redirects to Google consent
GET    /api/auth/google/callback     -> exchanges code, redirects to FRONTEND_URL with tokens
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/profile/me
PATCH  /api/profile/me
GET    /api/profile/:username

GET    /api/habits
POST   /api/habits
PATCH  /api/habits/:id
DELETE /api/habits/:id
POST   /api/habits/:id/archive

GET    /api/checkins/today
GET    /api/checkins/recent
POST   /api/checkins/verify          -> AI verification + streak/credits trigger

GET    /api/credits
GET    /api/credits/transactions

GET    /api/shields
POST   /api/shields/buy

GET    /api/badges

GET    /api/clubs
POST   /api/clubs
GET    /api/clubs/:id
POST   /api/clubs/:id/join
POST   /api/clubs/:id/leave
GET    /api/clubs/:id/messages
POST   /api/clubs/:id/messages

GET    /api/dms                       -> conversations
GET    /api/dms/:userId               -> messages with one user
POST   /api/dms/:userId               -> send DM

GET    /api/friends
POST   /api/friends/request
POST   /api/friends/:id/accept
POST   /api/friends/:id/decline
DELETE /api/friends/:id

GET    /api/mentorship/mentors
POST   /api/mentorship/request
POST   /api/mentorship/:id/accept
POST   /api/mentorship/:id/decline
GET    /api/mentorship/active

GET    /api/leaderboards/global
GET    /api/leaderboards/category/:category
GET    /api/leaderboards/friends

GET    /api/health
```

## Realtime (Socket.IO)

Connect with `auth: { token: <jwt> }`.

Events:
- `club:join` / `club:leave` / `club:message`
- `dm:send` / `dm:receive`
- `friend:request` / `friend:accept`
- `mentorship:notify`
- `presence:online` / `presence:offline`

## Local Development

```bash
cp .env.example .env
# edit DATABASE_URL, JWT_SECRET, etc.
npm install
npm run db:migrate:dev
npm run dev
```

Server runs on `http://localhost:4000`.

## Deploy to Render

1. Push this repo to GitHub.
2. In Render, click **New > Blueprint**, point at the repo. The root `render.yaml` provisions the web service and PostgreSQL database automatically.
   - If you create a normal Web Service instead of a Blueprint, set **Root Directory** to `backend`.
   - Use **Build Command**: `npm install && npm run build && npx prisma migrate deploy`
   - Use **Start Command**: `npm start`
3. Set sync-required secrets in the Render dashboard:
   - `CORS_ORIGIN` — your frontend URL(s), comma-separated
   - `FRONTEND_URL` — for OAuth redirect
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
   - `LOVABLE_API_KEY` (optional, enables AI verification)
4. First deploy runs `prisma migrate deploy` automatically.

## Frontend integration

Set `VITE_API_URL=https://your-api.onrender.com` and point the existing TanStack Start frontend at it (replaces the current Supabase serverFn layer). The schema in `prisma/schema.prisma` mirrors what the frontend already expects.
