# Fitness Challenge Tracker

WhatsApp fitness challenge leaderboard with daily score tracking.

## Quick Start

```bash
# Backend (Terminal 1)
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Frontend (Terminal 2)
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Admin: http://localhost:5173/admin

## Project Structure

```
backend/
  main.py        # FastAPI endpoints
  parser.py      # Message parsing (date + scores)
  storage.py     # JSON file read/write
  data.json      # Local data (gitignored)

frontend/src/
  components/
    Leaderboard.jsx   # Main leaderboard with columns: Rank|Name|Score|Δ|Streak|Pts Behind
    ProgressChart.jsx # Plotly line chart
    FunStats.jsx      # Prize pool, streaks, rivalries, slackers
    AdminPage.jsx     # Login + message submission form
  api.js              # fetchLatest(), fetchScores(), submitUpdate()
```

## Production

- **Backend**: Railway at `backend-production-b44f.up.railway.app`
- **Data**: Mounted volume at `/data/data.json`
- **API Key**: Set via `API_KEY` env var

## Key Features

### Leaderboard Columns
| Column | Description |
|--------|-------------|
| Rank | Gold/silver/bronze badges for top 3 |
| Δ (Delta) | Daily gain: +1 green, +2 fire, +4 starry |
| Streak | Consecutive gain days (shows "N🔥" for 2+) |
| Pts Behind | Gap from leader (em dash for 1st place) |

### Validation Rules
- Date must be today or yesterday (Pacific Time)
- Scores cannot decrease
- Daily gains must be 0, 1, 2, or 4

### Mobile
Leaderboard shows 4 columns on mobile (≤500px): Rank, Name, Score, Δ

## API

```bash
# Get all scores (for charts)
curl http://localhost:8000/api/scores

# Get latest day with daily gains
curl http://localhost:8000/api/latest

# Submit update (requires API key)
curl -X POST http://localhost:8000/api/update \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"message": "January 20\nPepo: 12\nMene: 10", "force": false}'
```

## Conventions

- **Commits**: Descriptive message + `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`
- **CSS**: Component-specific `.css` files, mobile breakpoint at 500px
- **State**: React hooks (useState, useEffect), no external state management
- **Styling**: No emojis in code unless user requests

## Common Tasks

### Add new leaderboard column
1. Add state/calculation in `Leaderboard.jsx`
2. Add header cell in `.header-row`
3. Add data cell in `.player-row`
4. Update grid-template-columns in CSS (both desktop and mobile)
5. Hide on mobile if needed via nth-child selector

### Debug streak calculation
Streaks are calculated by comparing consecutive entries' scores (not `daily_gains` from API). Check `calculateStreaks()` in Leaderboard.jsx.

## Reference

See `design.md` for detailed architecture and component documentation.
