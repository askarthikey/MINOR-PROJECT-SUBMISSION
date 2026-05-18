"""Badge definitions and evaluation logic."""

from __future__ import annotations

from typing import Any


# ── Static badge catalogue ─────────────────────────────────────────

BADGES: list[dict[str, str]] = [
    {"id": "first_session",   "name": "First Steps",       "icon": "🎯", "description": "Complete your first interview session"},
    {"id": "five_sessions",   "name": "On a Roll",         "icon": "🔥", "description": "Complete 5 interview sessions"},
    {"id": "ten_sessions",    "name": "Committed",          "icon": "💪", "description": "Complete 10 interview sessions"},
    {"id": "streak_3",        "name": "Streak Starter",     "icon": "⚡", "description": "Maintain a 3-day streak"},
    {"id": "streak_7",        "name": "Week Warrior",       "icon": "🗓️", "description": "Maintain a 7-day streak"},
    {"id": "perfect_score",   "name": "Flawless",           "icon": "💎", "description": "Score 95%+ in a session"},
    {"id": "rating_1500",     "name": "Developer",          "icon": "💻", "description": "Reach a rating of 1500"},
    {"id": "rating_2000",     "name": "Senior",             "icon": "🚀", "description": "Reach a rating of 2000"},
    {"id": "top_keyword",     "name": "Keyword King",       "icon": "🔑", "description": "Average keyword coverage ≥ 85% over 5 sessions"},
    {"id": "closure_master",  "name": "Closure Master",     "icon": "🔒", "description": "Score > 80% on 3 closure questions"},
    {"id": "async_expert",    "name": "Async Expert",       "icon": "⏳", "description": "Score > 80% on 3 async-related questions"},
    {"id": "consistent",      "name": "Consistent Coder",   "icon": "📈", "description": "5 consecutive sessions with score ≥ 60%"},
    {"id": "comeback",        "name": "Comeback Kid",       "icon": "🔄", "description": "Improve your rating by 200+ from your lowest"},
]


def get_badge_info(badge_id: str) -> dict[str, str] | None:
    """Look up a badge by ID."""
    for b in BADGES:
        if b["id"] == badge_id:
            return b
    return None


def check_simple_badges(rating_doc: dict[str, Any], session_score: float) -> list[str]:
    """
    Check badges that only depend on rating_doc fields.
    Returns list of newly-earned badge IDs.
    """
    existing = set(rating_doc.get("badges", []))
    new_badges: list[str] = []
    sp = rating_doc.get("sessions_played", 0)
    rating = rating_doc.get("rating", 1200)
    streak = rating_doc.get("streak_current", 0)
    peak = rating_doc.get("peak_rating", rating)

    checks: list[tuple[str, bool]] = [
        ("first_session",   sp >= 1),
        ("five_sessions",   sp >= 5),
        ("ten_sessions",    sp >= 10),
        ("streak_3",        streak >= 3),
        ("streak_7",        streak >= 7),
        ("perfect_score",   session_score >= 0.95),
        ("rating_1500",     rating >= 1500),
        ("rating_2000",     rating >= 2000),
    ]

    for badge_id, condition in checks:
        if badge_id not in existing and condition:
            new_badges.append(badge_id)

    return new_badges
