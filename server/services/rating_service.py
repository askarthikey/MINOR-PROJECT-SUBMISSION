"""
Rating service — ELO-like rating calculation, tier lookup, and updates.
"""

from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from server.db.mongo import get_collection
from server.models.rating import Rating, RatingHistoryEntry, get_tier


def calculate_rating_delta(session_score: float, avg_difficulty: float) -> int:
    """
    Calculate the rating change after an interview session.

    session_score : average composite score across all questions (0 – 1)
    avg_difficulty: average difficulty_rating of questions in the session
    """
    # Performance band
    if session_score >= 0.80:
        delta = 40  # excellent
    elif session_score >= 0.65:
        delta = 20  # good
    elif session_score >= 0.50:
        delta = 5   # average
    elif session_score >= 0.35:
        delta = -10  # below average
    else:
        delta = -25  # poor

    # Difficulty modifier
    if avg_difficulty >= 15:
        delta = int(delta * 1.5)
    elif avg_difficulty >= 10:
        delta = int(delta * 1.2)
    elif avg_difficulty < 5:
        delta = int(delta * 0.8)

    return delta


async def get_or_create_rating(user_id: str, initial_rating: int = 1200) -> dict:
    """Fetch or create a Rating document for the user."""
    col = get_collection("ratings")
    doc = await col.find_one({"user_id": user_id})
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc

    now = datetime.utcnow()
    new_doc = {
        "user_id": user_id,
        "rating": initial_rating,
        "rating_history": [{"value": initial_rating, "timestamp": now, "session_id": ""}],
        "peak_rating": initial_rating,
        "sessions_played": 0,
        "wins": 0,
        "streak_current": 0,
        "streak_best": 0,
        "last_active": now,
        "badges": [],
    }
    result = await col.insert_one(new_doc)
    new_doc["_id"] = str(result.inserted_id)
    return new_doc


async def update_rating(
    user_id: str,
    delta: int,
    session_id: str,
    session_score: float,
) -> dict:
    """
    Apply rating delta, update history, streak, and badges.
    Returns the updated rating document.
    """
    col = get_collection("ratings")
    doc = await get_or_create_rating(user_id)

    new_rating = max(0, min(3000, doc["rating"] + delta))
    peak = max(doc.get("peak_rating", 0), new_rating)
    sessions_played = doc.get("sessions_played", 0) + 1

    # Streak logic: if last_active was yesterday, increment; same day no change; else reset to 1
    now = datetime.utcnow()
    last = doc.get("last_active")
    streak_current = doc.get("streak_current", 0)

    if last is None:
        # First session ever — start streak at 1
        streak_current = 1
    elif isinstance(last, str):
        # Handle edge case: last_active stored as string
        try:
            last = datetime.fromisoformat(last.replace("Z", "+00:00").replace("+00:00", ""))
            days_diff = (now.date() - last.date()).days
            if days_diff == 1:
                streak_current += 1
            elif days_diff == 0:
                pass  # same day — no change
            else:
                streak_current = 1
        except Exception:
            streak_current = 1
    else:
        days_diff = (now.date() - last.date()).days
        if days_diff == 1:
            streak_current += 1
        elif days_diff == 0:
            # Same day — keep current streak but ensure at least 1
            streak_current = max(streak_current, 1)
        else:
            streak_current = 1

    streak_best = max(doc.get("streak_best", 0), streak_current)

    # Win if score >= 50%
    wins = doc.get("wins", 0) + (1 if session_score >= 0.50 else 0)

    history_entry = {
        "value": new_rating,
        "timestamp": now,
        "session_id": session_id,
    }

    await col.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "rating": new_rating,
                "peak_rating": peak,
                "sessions_played": sessions_played,
                "wins": wins,
                "streak_current": streak_current,
                "streak_best": streak_best,
                "last_active": now,
            },
            "$push": {
                "rating_history": {
                    "$each": [history_entry],
                    "$slice": -100,  # keep last 100 entries
                },
            },
        },
    )

    # Return fresh doc
    updated = await col.find_one({"user_id": user_id})
    updated["_id"] = str(updated["_id"])
    return updated


async def get_leaderboard(limit: int = 10) -> list[dict]:
    """Top N users by rating."""
    col = get_collection("ratings")
    users_col = get_collection("users")

    cursor = col.find().sort("rating", -1).limit(limit)
    entries = []
    rank = 1
    async for doc in cursor:
        user = await users_col.find_one({"_id": ObjectId(doc["user_id"])})
        tier_name, tier_icon = get_tier(doc["rating"])
        entries.append({
            "rank": rank,
            "user_id": doc["user_id"],
            "name": user["name"] if user else "Unknown",
            "avatar_url": user.get("avatar_url", "") if user else "",
            "rating": doc["rating"],
            "tier": tier_name,
            "tier_icon": tier_icon,
            "sessions_played": doc.get("sessions_played", 0),
        })
        rank += 1
    return entries
