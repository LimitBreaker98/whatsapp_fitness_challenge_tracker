# Fitness Challenge Tracker V2 - Design Document

## Overview

A web-based leaderboard for tracking a WhatsApp fitness challenge. Users post daily score updates to WhatsApp; one admin submits the consolidated daily update via a web form.

## Architecture

```
React Frontend ──▶ FastAPI Backend ──▶ data.json
```

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | React (hooks)     |
| Charts   | Plotly.js         |
| Backend  | Python + FastAPI  |
| Data     | JSON file         |
| Hosting  | Render or Fly.io  |

## Data Format

**Input (daily message):**
```
July 17
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
      "date": "2025-07-17",
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

**POST /api/update**
- Header: `X-API-Key: <secret>`
- Body: Raw text (daily message format)
- Response: `{ "success": true, "date": "2025-07-17" }`

## Frontend Components

### 1. Leaderboard
- Player name + cumulative score
- Progress bar per player (black = total, green segment = today's gain)
- Sorted by score descending

### 2. Progress Chart
- Plotly line chart
- X-axis: dates
- Y-axis: cumulative score
- One line per player
- Interactive hover showing all scores

### 3. Admin Page
- Route: `/admin?key=<secret>`
- Text area for pasting daily message
- Submit button
- Success/error feedback

## Daily Workflow

1. Challenge runs in WhatsApp group
2. At day end (PT timezone), admin copies summary
3. Admin pastes into `/admin` page, submits
4. Backend parses, appends to `data.json`
5. Frontend fetches fresh data on load

## Project Structure

```
/
├── backend/
│   ├── main.py          # FastAPI app
│   ├── parser.py        # Message parsing
│   ├── data.json        # Persistent storage
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── ProgressChart.jsx
│   │   │   └── AdminPage.jsx
│   │   └── api.js       # API calls
│   └── package.json
└── design.md
```

## Security

- Admin endpoint protected by API key in header
- Key passed via URL param for convenience: `/admin?key=xxx`
- No user authentication (trusted group)

## Future Considerations (Out of Scope for V2)

- Streak tracking
- Daily reminders
- Multiple challenges
- Player avatars
