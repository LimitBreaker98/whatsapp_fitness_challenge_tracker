import json
import os
from pathlib import Path
from typing import Dict, Optional

DATA_DIR = Path(os.getenv("DATA_DIR", Path(__file__).parent))
DATA_FILE = DATA_DIR / "data.json"
PROFILES_FILE = DATA_DIR / "profiles.json"
MAX_DESCRIPTION_LENGTH = 60


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
