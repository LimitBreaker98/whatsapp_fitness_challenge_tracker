import os
from collections import defaultdict
from datetime import datetime, timedelta, date
from zoneinfo import ZoneInfo
from typing import Optional, Tuple
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from parser import parse_message, ParseError
from storage import load_data, load_profiles, add_entry, get_latest_entry, get_previous_entry, entry_exists, get_vote_counts, submit_vote

PACIFIC_TZ = ZoneInfo("America/Los_Angeles")

app = FastAPI(title="Fitness Challenge Tracker API")

# CORS for frontend - configurable via environment variable
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# API key from environment variable
API_KEY = os.getenv("API_KEY", "dev-secret-key")

# Rate limiting for vote endpoint (in-memory, resets on restart)
VOTE_RATE_LIMIT = 5  # max attempts per window
VOTE_RATE_WINDOW = 60  # window in seconds
vote_attempts: dict[str, list[datetime]] = defaultdict(list)


def check_vote_rate_limit(ip: str) -> bool:
    """Check if IP has exceeded vote rate limit. Returns True if allowed."""
    now = datetime.now()
    cutoff = now - timedelta(seconds=VOTE_RATE_WINDOW)

    # Clean old attempts
    vote_attempts[ip] = [t for t in vote_attempts[ip] if t > cutoff]

    if len(vote_attempts[ip]) >= VOTE_RATE_LIMIT:
        return False

    vote_attempts[ip].append(now)
    return True


class UpdateRequest(BaseModel):
    message: str
    force: bool = False  # Set to True to overwrite existing entry


class UpdateResponse(BaseModel):
    success: bool
    date: str
    message: str
    requires_confirmation: bool = False  # True if entry exists and force=False


class VoteRequest(BaseModel):
    code: str
    choice: str  # "timeline" or "scroll"


def _compute_daily_gains(current_scores: dict, previous_scores: Optional[dict]) -> dict:
    """Compute daily gains by comparing current scores to previous day."""
    gains = {}
    for player, score in current_scores.items():
        if previous_scores and player in previous_scores:
            gains[player] = score - previous_scores[player]
        else:
            gains[player] = 0  # New player or first entry
    return gains


def _is_valid_date(date_str: str) -> Tuple[bool, str]:
    """
    Check if date is today or yesterday (Pacific Time).
    Returns (is_valid, error_message).
    """
    try:
        entry_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return False, f"Invalid date format: {date_str}"

    now_pt = datetime.now(PACIFIC_TZ)
    today = now_pt.date()
    yesterday = today - timedelta(days=1)

    if entry_date == today or entry_date == yesterday:
        return True, ""

    if entry_date > today:
        return False, f"Date {date_str} is in the future"

    return False, f"Date {date_str} is too old. Only today or yesterday allowed."


def _calculate_age(birthday: Optional[str], today: date) -> Optional[int]:
    if not birthday:
        return None
    try:
        birth_date = date.fromisoformat(birthday)
    except ValueError:
        return None
    if birth_date > today:
        return None
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


@app.get("/api/scores")
def get_scores():
    """Get all entries for charts."""
    data = load_data()
    return data


@app.get("/api/latest")
def get_latest():
    """Get latest day's scores with daily gains."""
    latest = get_latest_entry()

    if not latest:
        return {"date": None, "scores": {}, "daily_gains": {}}

    previous = get_previous_entry(latest["date"])
    previous_scores = previous["scores"] if previous else None

    daily_gains = _compute_daily_gains(latest["scores"], previous_scores)

    return {
        "date": latest["date"],
        "scores": latest["scores"],
        "daily_gains": daily_gains,
    }


@app.get("/api/profiles")
def get_profiles():
    """Get player profile data with computed age."""
    profiles = load_profiles()
    today = datetime.now(PACIFIC_TZ).date()

    response = {}
    for name, profile in profiles.items():
        birthday = profile.get("birthday")
        response[name] = {
            "nickname": profile.get("nickname"),
            "birthday": birthday,
            "age": _calculate_age(birthday, today),
            "description": profile.get("description"),
        }

    return response


@app.post("/api/update", response_model=UpdateResponse)
def submit_update(
    request: UpdateRequest,
    x_api_key: str = Header(None),
):
    """Submit a daily update. Requires API key."""
    # Validate API key
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Parse the message
    try:
        parsed = parse_message(request.message)
    except ParseError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Validate date (must be today or yesterday in Pacific Time)
    is_valid, error_msg = _is_valid_date(parsed["date"])
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Validate that entry is not before the latest entry (no backfilling old dates)
    latest = get_latest_entry()
    if latest and parsed["date"] < latest["date"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add entry for {parsed['date']}. Latest entry is {latest['date']}. Only updates for the latest date or newer are allowed.",
        )

    # Validate scores are non-decreasing compared to previous entry
    # and daily gains are only 0, 1, 2, or 4 (challenge rules)
    ALLOWED_GAINS = {0, 1, 2, 4}

    if latest:
        # If updating same date, compare against the entry before it
        if parsed["date"] == latest["date"]:
            prev_entry = get_previous_entry(latest["date"])
            prev_scores = prev_entry["scores"] if prev_entry else {}
        else:
            prev_scores = latest["scores"]

        decreased = []
        invalid_gains = []
        for player, new_score in parsed["scores"].items():
            if player in prev_scores:
                gain = new_score - prev_scores[player]
                if gain < 0:
                    decreased.append(f"{player}: {prev_scores[player]} -> {new_score}")
                elif gain not in ALLOWED_GAINS:
                    invalid_gains.append(f"{player}: +{gain} (only +1, +2, +4 allowed)")

        if decreased:
            raise HTTPException(
                status_code=400,
                detail=f"Scores cannot decrease. Invalid changes: {', '.join(decreased)}",
            )

        if invalid_gains:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid daily gains: {', '.join(invalid_gains)}",
            )

    # Check if entry already exists
    if entry_exists(parsed["date"]) and not request.force:
        return UpdateResponse(
            success=False,
            date=parsed["date"],
            message=f"Entry for {parsed['date']} already exists. Confirm to overwrite.",
            requires_confirmation=True,
        )

    # Store the entry
    is_new = add_entry(parsed["date"], parsed["scores"])

    action = "added" if is_new else "updated"
    return UpdateResponse(
        success=True,
        date=parsed["date"],
        message=f"Entry {action} for {parsed['date']}",
    )


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/votes")
def get_votes():
    """Get current vote counts for chart views."""
    return get_vote_counts()


@app.post("/api/vote")
def post_vote(vote_request: VoteRequest, request: Request):
    """Submit a vote for preferred chart view."""
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if not check_vote_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please wait a minute before trying again."
        )

    result = submit_vote(vote_request.code, vote_request.choice)

    if "error" in result:
        if result["error"] == "invalid_code":
            raise HTTPException(status_code=400, detail="Invalid code. Ask Jorge for your voting code.")
        elif result["error"] == "already_voted":
            raise HTTPException(status_code=400, detail="This code has already voted!")
        elif result["error"] == "invalid_choice":
            raise HTTPException(status_code=400, detail="Choice must be 'timeline' or 'scroll'")

    return result
