"""Rating model and tier definitions."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RatingHistoryEntry(BaseModel):
    value: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_id: str = ""


class Rating(BaseModel):
    """Rating document in MongoDB."""
    id: str = Field(default="", alias="_id")
    user_id: str = ""
    rating: int = 1200
    rating_history: list[RatingHistoryEntry] = []
    peak_rating: int = 1200
    sessions_played: int = 0
    wins: int = 0
    streak_current: int = 0
    streak_best: int = 0
    last_active: Optional[datetime] = None
    badges: list[str] = []

    model_config = {"populate_by_name": True}


class RatingResponse(BaseModel):
    """Returned to frontend."""
    rating: int
    peak_rating: int
    tier: str
    tier_icon: str
    sessions_played: int
    streak_current: int
    streak_best: int
    badges: list[str] = []
    rating_history: list[dict] = []


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    avatar_url: str = ""
    rating: int
    tier: str
    tier_icon: str


# ── Tier definitions ──────────────────────────────────────────────

TIERS = [
    {"name": "Rookie",     "min": 0,    "max": 799,  "icon": "🥉"},
    {"name": "Apprentice", "min": 800,  "max": 1199, "icon": "🔰"},
    {"name": "Developer",  "min": 1200, "max": 1599, "icon": "💻"},
    {"name": "Senior Dev", "min": 1600, "max": 1999, "icon": "⚡"},
    {"name": "Tech Lead",  "min": 2000, "max": 2399, "icon": "🚀"},
    {"name": "Architect",  "min": 2400, "max": 2799, "icon": "🏆"},
    {"name": "Legend",     "min": 2800, "max": 3000, "icon": "👑"},
]


def get_tier(rating: int) -> tuple[str, str]:
    """Return (tier_name, tier_icon) for the given rating."""
    for tier in TIERS:
        if tier["min"] <= rating <= tier["max"]:
            return tier["name"], tier["icon"]
    return "Legend", "👑"
