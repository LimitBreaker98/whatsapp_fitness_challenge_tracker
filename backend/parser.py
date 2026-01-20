import re
from datetime import datetime
from typing import Tuple
from dateutil import parser as date_parser


class ParseError(Exception):
    """Raised when message parsing fails."""

    pass


def parse_message(message: str, year: int = None) -> dict:
    """
    Parse a daily update message.

    Input format:
        July 17
        Pepo: 12
        Mene: 10
        Josh: 9
        Pocho: 8

    Returns:
        {
            "date": "2025-07-17",
            "scores": {"Pepo": 12, "Mene": 10, "Josh": 9, "Pocho": 8}
        }
    """
    if year is None:
        year = datetime.now().year

    lines = [line.strip() for line in message.strip().split("\n") if line.strip()]

    if len(lines) < 2:
        raise ParseError("Message must have at least a date and one score")

    # Parse date from first line
    date_str = lines[0]
    date = _parse_date(date_str, year)

    # Parse scores from remaining lines
    scores = {}
    for line in lines[1:]:
        name, score = _parse_score_line(line)
        scores[name] = score

    if not scores:
        raise ParseError("No valid scores found")

    return {"date": date, "scores": scores}


def _parse_date(date_str: str, year: int) -> str:
    """
    Parse date string like 'July 17' into 'YYYY-MM-DD'.
    """
    try:
        # Try parsing with dateutil (handles 'July 17', 'Jul 17', etc.)
        parsed = date_parser.parse(date_str, default=datetime(year, 1, 1))
        return parsed.strftime("%Y-%m-%d")
    except Exception:
        raise ParseError(f"Could not parse date: '{date_str}'")


def _parse_score_line(line: str) -> Tuple[str, int]:
    """
    Parse a score line like 'Pepo: 12' or 'Pepo - 12'.
    Returns (name, score) tuple.
    """
    # Match patterns: "Name: 12", "Name - 12", "Name 12"
    patterns = [
        r"^(.+?):\s*(\d+)$",  # Name: 12
        r"^(.+?)\s*-\s*(\d+)$",  # Name - 12
        r"^(.+?)\s+(\d+)$",  # Name 12
    ]

    for pattern in patterns:
        match = re.match(pattern, line.strip())
        if match:
            name = match.group(1).strip()
            score = int(match.group(2))
            return name, score

    raise ParseError(f"Could not parse score line: '{line}'")
