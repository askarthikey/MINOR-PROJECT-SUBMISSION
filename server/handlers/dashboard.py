"""
Dashboard handler — aggregated view of user stats.
"""

from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends

from server.db.mongo import get_collection
from server.middleware.auth import get_current_user
from server.models.rating import get_tier
from server.services.rating_service import get_or_create_rating

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
async def get_dashboard(user_id: str = Depends(get_current_user)):
    """
    Aggregated dashboard data: profile, rating, recent sessions, activity.
    """
    # User profile
    users_col = get_collection("users")
    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"error": "User not found"}

    # Rating info
    rating_doc = await get_or_create_rating(user_id)
    rating = rating_doc.get("rating", 1200)
    tier_name, tier_icon = get_tier(rating)

    # Recent sessions (last 5)
    sessions_col = get_collection("sessions")
    recent_cursor = (
        sessions_col.find({"user_id": user_id, "status": "completed"})
        .sort("ended_at", -1)
        .limit(5)
    )
    recent_sessions = []
    async for s in recent_cursor:
        s["_id"] = str(s["_id"])
        recent_sessions.append({
            "id": s["_id"],
            "mode": s.get("mode", "practice"),
            "domain": s.get("domain", ""),
            "total_score": s.get("total_score", 0),
            "rating_delta": s.get("rating_delta", 0),
            "duration_seconds": s.get("duration_seconds", 0),
            "started_at": str(s.get("started_at", "")),
            "ended_at": str(s.get("ended_at", "")),
        })

    # Stats summary
    total_sessions = await sessions_col.count_documents(
        {"user_id": user_id, "status": "completed"}
    )
    attempts_col = get_collection("question_attempts")
    total_attempts = await attempts_col.count_documents(
        {"user_id": user_id}
    )

    # Compute average composite score across all attempts
    avg_score = 0.0
    if total_attempts > 0:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "avg": {"$avg": "$scores.composite"}}},
        ]
        agg_cursor = attempts_col.aggregate(pipeline)
        agg = await agg_cursor.to_list(length=1)
        if agg and agg[0].get("avg") is not None:
            avg_score = agg[0]["avg"]

    # Compute topics mastered: domains where avg score >= 0.6
    topics_mastered = 0
    domain_pipeline = [
        {"$match": {"user_id": user_id, "status": "completed"}},
        {"$group": {
            "_id": "$domain",
            "avg_score": {"$avg": "$total_score"},
            "count": {"$sum": 1},
        }},
        {"$match": {"avg_score": {"$gte": 60}, "count": {"$gte": 1}}},
    ]
    domain_cursor = sessions_col.aggregate(domain_pipeline)
    domain_agg = await domain_cursor.to_list(length=50)
    topics_mastered = len(domain_agg)

    # Rating history (last 20 points)
    history = rating_doc.get("rating_history", [])[-20:]

    return {
        "user": {
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "avatar_url": user.get("avatar_url", ""),
            "onboarding_complete": user.get("onboarding_complete", False),
        },
        "rating": {
            "current": rating,
            "peak": rating_doc.get("peak_rating", rating),
            "tier": tier_name,
            "tier_icon": tier_icon,
            "sessions_played": rating_doc.get("sessions_played", 0),
            "streak_current": rating_doc.get("streak_current", 0),
            "streak_best": rating_doc.get("streak_best", 0),
            "badges": rating_doc.get("badges", []),
            "history": [
                {"value": h["value"], "timestamp": str(h["timestamp"])}
                for h in history
            ],
        },
        "stats": {
            "total_sessions": total_sessions,
            "total_questions": total_attempts,
            "avg_score": avg_score,
            "topics_mastered": topics_mastered,
        },
        "recent_sessions": recent_sessions,
    }
