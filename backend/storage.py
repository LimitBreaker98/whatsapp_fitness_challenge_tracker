import json
import os
import shutil
from pathlib import Path
from typing import Dict, Optional

DATA_DIR = Path(os.getenv("DATA_DIR", Path(__file__).parent))
DATA_FILE = DATA_DIR / "data.json"
PROFILES_FILE = DATA_DIR / "profiles.json"
VOTES_FILE = DATA_DIR / "votes.json"
BUNDLED_PROFILES = Path(__file__).parent / "profiles.json"
MAX_DESCRIPTION_LENGTH = 60


def _init_profiles():
    """Copy bundled profiles.json to DATA_DIR if not present."""
    if not PROFILES_FILE.exists() and BUNDLED_PROFILES.exists():
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy(BUNDLED_PROFILES, PROFILES_FILE)


_init_profiles()


def _get_empty_data() -> dict:
    return {"entries": []}


def load_data() -> dict:
    """Load data from JSON file. Returns empty structure if file doesn't exist."""
    if not DATA_FILE.exists():
        return _get_empty_data()

    with open(DATA_FILE, "r") as f:
        data = json.load(f)

    # Ensure required keys exist for older data files.
    if "entries" not in data:
        data["entries"] = []

    return data


def load_profiles() -> Dict[str, dict]:
    """Load player profiles from JSON file. Returns empty dict if missing."""
    if not PROFILES_FILE.exists():
        return {}

    with open(PROFILES_FILE, "r") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        return {}

    normalized = {}
    for name, profile in data.items():
        if not isinstance(profile, dict):
            continue
        description = profile.get("description")
        if isinstance(description, str) and len(description) > MAX_DESCRIPTION_LENGTH:
            description = description[:MAX_DESCRIPTION_LENGTH].rstrip()
        normalized[name] = {**profile, "description": description}

    return normalized


def save_data(data: dict) -> None:
    """Save data to JSON file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def add_entry(date: str, scores: Dict[str, int]) -> bool:
    """
    Add a new entry. If date already exists, update it.
    Returns True if new entry, False if updated existing.
    """
    data = load_data()

    # Check if date already exists
    for entry in data["entries"]:
        if entry["date"] == date:
            entry["scores"] = scores
            save_data(data)
            return False

    # Add new entry
    data["entries"].append({"date": date, "scores": scores})

    # Sort entries by date
    data["entries"].sort(key=lambda x: x["date"])

    save_data(data)
    return True


def get_latest_entry() -> Optional[dict]:
    """Get the most recent entry, or None if no entries exist."""
    data = load_data()
    if not data["entries"]:
        return None
    return data["entries"][-1]


def get_previous_entry(date: str) -> Optional[dict]:
    """Get the entry before the given date, or None if not found."""
    data = load_data()
    entries = data["entries"]

    for i, entry in enumerate(entries):
        if entry["date"] == date and i > 0:
            return entries[i - 1]

    return None


def entry_exists(date: str) -> bool:
    """Check if an entry exists for the given date."""
    data = load_data()
    return any(entry["date"] == date for entry in data["entries"])


# Vote storage functions

# Environment variable format: {"CODE1":"Name1","CODE2":"Name2",...}
VOTE_CODES_ENV = os.getenv("VOTE_CODES")


def _get_empty_votes() -> dict:
    return {"vote_codes": {}, "vote_counts": {"timeline": 0, "podium": 0, "both": 0}}


def _init_votes_from_env() -> dict:
    """Initialize votes structure from VOTE_CODES environment variable."""
    if not VOTE_CODES_ENV:
        return _get_empty_votes()

    try:
        codes_map = json.loads(VOTE_CODES_ENV)
        vote_codes = {
            code: {"name": name, "voted": None}
            for code, name in codes_map.items()
        }
        return {"vote_codes": vote_codes, "vote_counts": {"timeline": 0, "podium": 0, "both": 0}}
    except json.JSONDecodeError:
        return _get_empty_votes()


def load_votes() -> dict:
    """Load votes data. Uses env var for codes, file for persisted votes."""
    # If no env var, fall back to file (for local development)
    if not VOTE_CODES_ENV:
        if not VOTES_FILE.exists():
            return _get_empty_votes()
        with open(VOTES_FILE, "r") as f:
            return json.load(f)

    # Load persisted vote state from file
    if VOTES_FILE.exists():
        with open(VOTES_FILE, "r") as f:
            persisted = json.load(f)
    else:
        persisted = {"vote_codes": {}, "vote_counts": {"timeline": 0, "podium": 0, "both": 0}}

    # Merge env codes with persisted vote state
    env_data = _init_votes_from_env()
    for code, code_data in env_data["vote_codes"].items():
        if code in persisted.get("vote_codes", {}):
            # Preserve voted status from persisted data
            code_data["voted"] = persisted["vote_codes"][code].get("voted")

    env_data["vote_counts"] = persisted.get("vote_counts", {"timeline": 0, "scroll": 0})
    return env_data


def save_votes(data: dict) -> None:
    """Save votes data to JSON file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(VOTES_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get_vote_counts() -> dict:
    """Get current vote counts."""
    data = load_votes()
    return data["vote_counts"]


def submit_vote(code: str, choice: str) -> dict:
    """
    Submit a vote using a secret code.
    Returns dict with 'success', 'name', or 'error'.
    """
    if choice not in ("timeline", "podium", "both"):
        return {"error": "invalid_choice"}

    data = load_votes()
    code_upper = code.upper().strip()

    if code_upper not in data["vote_codes"]:
        return {"error": "invalid_code"}

    code_data = data["vote_codes"][code_upper]

    if code_data["voted"] is not None:
        return {"error": "already_voted", "name": code_data["name"]}

    # Record the vote
    code_data["voted"] = choice
    data["vote_counts"][choice] += 1
    save_votes(data)

    return {"success": True, "name": code_data["name"]}
