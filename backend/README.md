# LifeSync Node Backend

## Folder structure

```text
backend/
  package.json
  .env.example
  src/
    app.js
    server.js
    config/
    controllers/
    db/
    middleware/
    routes/
    services/
    utils/
```

## Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Run `npm install` inside `backend`.
3. Start the server with `npm start` or `npm run dev`.
4. Keep the frontend pointed at `http://localhost:8000`.

## Migration notes

- FastAPI routes were migrated to Express while preserving the same route prefixes and core response shapes.
- Authentication still uses username/password login plus bearer session tokens stored on the user document.
- Mongo collection names remain unchanged, so the existing database can be reused.
- Habit weekly tracking now stores week-specific progress in `weekly_logs` while still returning `week_progress` for backward compatibility.
- ADHD-focused additions are additive:
  - `GET /api/habits/focus`
  - `GET /api/habits/insights`
  - `GET /api/habits/daily-summary`

## Assumptions

- Week boundaries are Monday through Sunday.
- Existing legacy habits without stored week metadata are treated as a fresh current-week view to prevent previous-week overlap from leaking into the selected week.
