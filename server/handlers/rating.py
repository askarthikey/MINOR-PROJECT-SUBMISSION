"""
Rating handler — my rating, leaderboard.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from server.middleware.auth import get_current_user
from server.models.rating import get_tier
from server.services.rating_service import get_or_create_rating, get_leaderboard

router = APIRouter(prefix="/api/rating", tags=["rating"])


@router.get("/me")
async def my_rating(user_id: str = Depends(get_current_user)):
    """Get the authenticated user's rating, tier, streak, and badges."""
    doc = await get_or_create_rating(user_id)
    tier_name, tier_icon = get_tier(doc.get("rating", 1200))

    # Trim rating history for response (last 20)
    history = doc.get("rating_history", [])[-20:]

    return {
        "rating": doc.get("rating", 1200),
        "peak_rating": doc.get("peak_rating", 1200),
        "tier": tier_name,
        "tier_icon": tier_icon,
        "sessions_played": doc.get("sessions_played", 0),
        "streak_current": doc.get("streak_current", 0),
        "streak_best": doc.get("streak_best", 0),
        "badges": doc.get("badges", []),
        "rating_history": [
            {"value": h["value"], "timestamp": str(h["timestamp"])}
            for h in history
        ],
    }


@router.get("/leaderboard")
async def leaderboard(limit: int = 10):
    """Get the top users by rating."""
    return await get_leaderboard(limit=limit)
