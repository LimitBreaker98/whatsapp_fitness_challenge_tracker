# Rulings Feature Plan

## Goal
Add a "Rulings" page where the Judge/VAR can publish decisions to resolve
controversies. The content is a single editable text board. Everyone can read;
only holders of a judge API key can edit.

## Non-goals
- No per-player or per-date structured rulings in v1 (just a single text blob).
- No audit trail or version history in v1.

## Data Model
- New file: `backend/rulings.json`
  - Example:
    {
      "text": "",
      "updated_at": "2026-01-20T18:42:00Z",
      "updated_by": "judge"
    }

## Backend Changes
- Add storage helpers in `backend/storage.py`:
  - `RULINGS_FILE = DATA_DIR / "rulings.json"`
  - `load_rulings() -> dict` (return defaults if missing)
  - `save_rulings(text: str, updated_by: str = "judge")`
- Add API in `backend/main.py`:
  - `GET /api/rulings` (public): returns `{ text, updated_at, updated_by }`.
  - `PUT /api/rulings` (auth required): accepts `{ text }`.
- Auth:
  - New env var `JUDGE_API_KEY` (default e.g. `dev-judge-key` in dev).
  - Require `X-Judge-API-Key` header on `PUT /api/rulings`.
- Validation:
  - Ensure `text` is a string.
  - Optional max length (e.g. 5k) to avoid abuse.
- Persistence:
  - Save to `backend/rulings.json` in the same DATA_DIR as `data.json`.

## Frontend Changes
- Add new route `/rulings` and nav link.
- New component `RulingsPage.jsx`:
  - Read-only view by default: show text + last updated info.
  - Edit panel with a textarea + save button.
  - Judge key input field (not persisted, or optionally stored in localStorage).
  - On save, call `PUT /api/rulings` with `X-Judge-API-Key`.
  - On success, refresh displayed text and timestamp.
- i18n:
  - Add labels for page title, instructions, key input, save button, and errors.

## UI/UX Notes
- Simple, legible card with a “rulings board” feel.
- Use wrapping and preserve line breaks (`white-space: pre-wrap`).
- Show a short disclaimer that only the judge may edit.

## Security Considerations
- Only the judge API key can write.
- Consider rate limiting (optional v2).
- If key is entered in the UI, avoid logging it and do not send unless saving.

## Open Questions
- Should rulings support markdown (headings/bullets) or plain text only?
- Should we store a small edit history (even just last 3 updates)?

## Milestones
1) Backend storage + API
2) Frontend page + nav link
3) Auth wiring + UI validation
4) Manual QA on read/write flow
