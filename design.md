# Fitness Challenge Tracker - Design Document

## Overview

A web-based leaderboard for tracking a WhatsApp fitness challenge. Users post daily score updates to WhatsApp; one admin submits the consolidated daily update via a web form.

## Architecture

```
React Frontend ──▶ FastAPI Backend ──▶ data.json
     │                    │
     │                    └── /data mount (Railway)
     └── Vercel/Static hosting
```

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | React 18 (hooks)  |
| Charts   | Plotly.js         |
| Backend  | Python + FastAPI  |
| Data     | JSON file         |
| Hosting  | Railway (backend) |

## Data Format

**Input (daily message):**
```
January 20
Pepo: 12
Mene: 10
Josh: 9
Pocho: 8
```

**Storage (`data.json`):**
```json
{
  "entries": [
    {
      "date": "2026-01-20",
      "scores": {
        "Pepo": 12,
        "Mene": 10,
        "Josh": 9,
        "Pocho": 8
      }
    }
  ]
}
```

Entries sorted chronologically. Daily gains computed by diffing consecutive entries.

## API Endpoints

| Method | Endpoint       | Description                          | Auth        |
|--------|----------------|--------------------------------------|-------------|
| GET    | `/api/scores`  | All entries for charts               | None        |
| GET    | `/api/latest`  | Latest day's scores + daily gains    | None        |
| POST   | `/api/update`  | Submit daily update                  | API key     |
| GET    | `/api/health`  | Health check                         | None        |

**POST /api/update**
- Header: `X-API-Key: <secret>`
- Body: `{ "message": "January 20\nPepo: 12\n...", "force": false }`
- Response: `{ "success": true, "date": "2026-01-20", "message": "Entry added" }`
- Validates: date (today/yesterday PT), scores non-decreasing, gains in {0,1,2,4}

## Frontend Components

### 1. Leaderboard
**Columns:** Rank | Name | Score | Δ | Streak | Pts Behind

| Feature | Description |
|---------|-------------|
| Rank badges | Gold/silver/bronze for top 3 |
| Δ (Delta) | Daily gain with tiered badges |
| Streak | Consecutive days with gains (2+ shows fire emoji) |
| Pts Behind | Points behind leader |
| Welcome badge | Purple badge for new players |

**Delta badge tiers:**
- +1: Green badge
- +2: Fiery orange with flame animation
- +4: Starry night with shooting star

**Mobile (≤500px):** Shows only Rank, Name, Score, Δ

### 2. Progress Chart
- Plotly line chart
- X-axis: dates, Y-axis: cumulative score
- One line per player
- Interactive hover showing all scores

### 3. Fun Stats
- Prize Pool card ($20/player except free rider)
- Projected Payouts (50/35/10/5% distribution)
- Active Streaks (players with 2+ day streaks)
- Most Consistent (lowest variance in daily gains)
- Rivalries (players within 5 points)
- Slackers (no points in 2+ days)

### 4. Admin Page
- Route: `/admin`
- Login form (API key stored in session)
- Text area for pasting daily message
- Confirmation dialog for overwrites
- Success/error feedback

## Daily Workflow

1. Challenge runs in WhatsApp group
2. At day end (PT timezone), admin copies summary
3. Admin logs into `/admin`, pastes message, submits
4. Backend parses, validates, appends to `data.json`
5. Frontend fetches fresh data on load

## Project Structure

```
/
├── backend/
│   ├── main.py          # FastAPI app + endpoints
│   ├── parser.py        # Message parsing logic
│   ├── storage.py       # JSON file operations
│   ├── data.json        # Persistent storage (gitignored)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js           # API calls
│   │   └── components/
│   │       ├── Leaderboard.jsx/css
│   │       ├── ProgressChart.jsx/css
│   │       ├── FunStats.jsx/css
│   │       └── AdminPage.jsx/css
│   └── package.json
├── CLAUDE.md            # AI assistant context
└── design.md            # This file
```

## Security

- Admin endpoint protected by API key in `X-API-Key` header
- Login form stores key in sessionStorage
- Key set via `API_KEY` environment variable
- No user authentication (trusted group)
- CORS configured for allowed origins

## Validation Rules

1. **Date**: Must be today or yesterday (Pacific Time)
2. **Scores**: Cannot decrease from previous entry
3. **Daily gains**: Must be 0, 1, 2, or 4 (challenge rules)
4. **No backfilling**: Cannot add entries older than latest

## Future Considerations

- [ ] Trend column (rank movement) - removed for now, needs better name
- [ ] Daily reminders
- [ ] Multiple challenges
- [ ] Player avatars
- [ ] Historical stats page
