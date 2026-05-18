"""
Badge service — evaluates and awards badges after each session.
"""

from __future__ import annotations

from server.db.mongo import get_collection
from server.models.badge import check_simple_badges


async def evaluate_and_award_badges(
    user_id: str,
    rating_doc: dict,
    session_score: float,
) -> list[str]:
    """
    Check all badge conditions and award any newly earned badges.
    Returns list of newly awarded badge IDs.
    """
    new_badges = check_simple_badges(rating_doc, session_score)

    if new_badges:
        col = get_collection("ratings")
        await col.update_one(
            {"user_id": user_id},
            {"$addToSet": {"badges": {"$each": new_badges}}},
        )

    return new_badges
