# Strava Auto-Import Plan

This document captures a concrete, implementation-focused plan to automatically
ingest Strava run distance data and update the challenge tracker with minimal
manual input (aside from admin overrides).

## Reality Check (Unavoidable Constraints)
- Strava data requires **per-user authorization** (OAuth). There is no legal or
  technical way to access athlete data without a one-time consent flow.
- After authorization, ingestion can be fully automatic via **webhooks**.
- A **public HTTPS endpoint** is required for Strava to deliver webhook events.

## Goals
- Automatically ingest running distance from Strava.
- Update daily scores with minimal human input.
- Keep admin overrides possible (admin page remains valid).
- Avoid full login experience in the app: provide simple "Connect Strava" links.

## High-Level Architecture
1) **OAuth Authorization** (one-time per player)
2) **Webhook Events** from Strava when activities are created/updated
3) **Activity Fetch** to get distance and timestamps
4) **Daily Aggregation** mapped to the challenge scoring rules

### Data Flow Summary
- Athlete authorizes → backend stores tokens + athlete ID
- Strava webhook fires → backend fetches activity details
- Backend computes score → updates daily totals

## Data Model Changes (Minimal)
If using JSON storage:

```json
{
  "strava": {
    "athletes": {
      "123456": {
        "player": "Josh",
        "access_token": "...",
        "refresh_token": "...",
        "expires_at": 1737063342
      }
    },
    "activity_cache": {
      "activity_id_1": {
        "athlete_id": "123456",
        "date": "2025-01-20",
        "distance_km": 6.2
      }
    }
  }
}
```

Why cache activities? Strava can send duplicate events or updates.
Caching prevents double-counting and enables adjustments.

## Backend API Endpoints

### 1) OAuth Start (per player)
`GET /api/strava/connect?player=Josh`
- Redirects to Strava OAuth consent page.
- `state` parameter should include signed player name.

### 2) OAuth Callback
`GET /api/strava/callback?code=...&state=...`
- Exchange `code` for tokens.
- Store `access_token`, `refresh_token`, `expires_at`, and athlete ID.

### 3) Webhook Verification
`GET /api/strava/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`
- Required by Strava to verify the endpoint.
- Respond with the challenge value.

### 4) Webhook Event Receiver
`POST /api/strava/webhook`
- Receives events for activity create/update/delete.
- For create/update:
  - Fetch activity details by ID.
  - If run activity, compute distance.
  - Update daily totals and cache activity.
- For delete: remove cached activity and adjust daily totals (optional for v1).

## OAuth + Webhook Details

### Strava App Setup
- Create app at: https://www.strava.com/settings/api
- Set:
  - Authorization Callback Domain: your backend domain
  - Website: frontend URL
  - Webhook endpoint: `/api/strava/webhook`

### Required Scopes
- `read, activity:read` (or `activity:read_all` if needed)

### Token Refresh
When access tokens expire:
`POST https://www.strava.com/oauth/token`

## Scoring Integration
Define mapping from distance to points. Example:
- 0–2 km: +1
- 2–5 km: +2
- >5 km: +4

Keep this mapping centralized so admin can override or adjust later.

## Admin UI (Minimal)
Add a small section to Admin Page:
- List players with Strava link status.
- A “Connect Strava” button per player (links to `/api/strava/connect?player=...`).

No full login UI required.

## Edge Cases & Practical Constraints
- Duplicate webhooks → use activity cache.
- Activity edits → update cached activity and daily total.
- Time zones → use athlete timezone to define a “day.”
- Missed webhook events → add manual sync endpoint.

## Optional Sync Endpoint
`POST /api/strava/sync?player=Josh&since=2025-01-01`
- Backfill or resync if webhooks failed.

## Deployment Requirements
- Backend must be publicly accessible with HTTPS.
- Store secrets:
  - `STRAVA_CLIENT_ID`
  - `STRAVA_CLIENT_SECRET`
  - `STRAVA_VERIFY_TOKEN`

## Phased Implementation Plan

### Phase 1 (MVP, 1–2 days)
1) Add OAuth endpoints.
2) Store tokens + athlete IDs.
3) Add webhook verification and event receiver.
4) Fetch activity details and apply scoring.

### Phase 2 (Stability, ~1 day)
1) Activity cache to prevent double-counting.
2) Token refresh handling.
3) Manual sync endpoint for recovery.

### Phase 3 (Admin UX, ~0.5 day)
1) Admin page: link status + connect buttons.

## Feasibility Summary
- **Feasible** if one-time OAuth per player is acceptable.
- **Requires** public HTTPS URL for webhooks.
- **Total effort** ~2–4 days for a reliable MVP.

