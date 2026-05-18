"""
Session handler — start, end, and list interview sessions.
Supports multiple modes: practice, interview (mock), speed.
Supports multiple domains: JavaScript, ML, OS, CN, OOPs, DBMS.
"""

from __future__ import annotations

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from server.db.mongo import get_collection
from server.middleware.auth import get_current_user
from server.models.session import SessionCreate
from server.services.question_service import (
    get_next_question,
    question_to_dto,
    resolve_domain,
    AVAILABLE_DOMAINS,
)
from server.services.gemini_service import generate_question as gemini_generate
from server.services.rating_service import (
    calculate_rating_delta,
    get_or_create_rating,
    update_rating,
)
from server.services.badge_service import evaluate_and_award_badges
from server.services.session_state import (
    create_session_state,
    get_session_state,
    remove_session_state,
    difficulty_from_rating,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# ── Mode configuration ────────────────────────────────────────────

MODE_CONFIG = {
    "practice": {
        "max_questions": 5,
        "session_timer": None,           # No time limit
        "per_question_timer": None,
        "rating_impact": 0.0,            # No rating change
        "hints_enabled": True,
        "adaptive_difficulty": False,    # Fixed difficulty
        "camera_required": False,
        "label": "Practice",
    },
    "interview": {
        "max_questions": 10,
        "session_timer": 1800,           # 30 minutes total
        "per_question_timer": None,
        "rating_impact": 1.0,            # Full ELO change
        "hints_enabled": False,
        "adaptive_difficulty": True,     # n+2 strategy
        "camera_required": True,
        "label": "Mock Interview",
    },
    "speed": {
        "max_questions": 15,
        "session_timer": None,
        "per_question_timer": 60,        # 60 seconds per question
        "rating_impact": 0.5,            # Half ELO change
        "hints_enabled": False,
        "adaptive_difficulty": True,
        "camera_required": False,
        "label": "Speed Round",
    },
}


@router.get("/domains")
async def get_domains():
    """Return available interview domains."""
    return {"domains": AVAILABLE_DOMAINS}


@router.get("/modes")
async def get_modes():
    """Return available session modes and their configuration."""
    modes = []
    for mode_id, config in MODE_CONFIG.items():
        modes.append({
            "id": mode_id,
            "label": config["label"],
            "max_questions": config["max_questions"],
            "rating_impact": config["rating_impact"],
            "hints_enabled": config["hints_enabled"],
            "camera_required": config["camera_required"],
            "session_timer": config["session_timer"],
            "per_question_timer": config["per_question_timer"],
        })
    return {"modes": modes}


@router.post("/start")
async def start_session(
    body: SessionCreate,
    user_id: str = Depends(get_current_user),
):
    """Start a new interview, practice, or speed session."""
    # Resolve mode config
    mode = body.mode or "interview"
    config = MODE_CONFIG.get(mode, MODE_CONFIG["interview"])
    resolved_domain = resolve_domain(body.domain)

    # Get user's current rating for difficulty seeding
    rating_doc = await get_or_create_rating(user_id)
    current_rating = rating_doc.get("rating", 1200)

    # For practice mode, start at a lower difficulty
    if mode == "practice":
        initial_difficulty = max(1, difficulty_from_rating(current_rating) - 2)
    else:
        initial_difficulty = difficulty_from_rating(current_rating)

    # Get cross-session used question IDs
    users_col = get_collection("users")
    user = await users_col.find_one({"_id": ObjectId(user_id)})
    user_last_50 = user.get("last_50_question_ids", []) if user else []

    # Create session document
    sessions_col = get_collection("sessions")
    now = datetime.utcnow()
    session_doc = {
        "user_id": user_id,
        "mode": mode,
        "domain": resolved_domain,
        "started_at": now,
        "ended_at": None,
        "duration_seconds": 0,
        "rating_before": current_rating,
        "rating_after": current_rating,
        "rating_delta": 0,
        "question_ids_used": [],
        "total_score": 0.0,
        "status": "active",
    }
    result = await sessions_col.insert_one(session_doc)
    session_id = str(result.inserted_id)

    max_questions = config["max_questions"]

    # Initialise in-memory session state
    state = create_session_state(
        session_id=session_id,
        user_id=user_id,
        initial_difficulty=initial_difficulty,
        topic=body.topic,
        mode=mode,
        max_questions=max_questions,
    )

    # Fetch first question
    difficulty = state.advance()
    question = await get_next_question(
        difficulty=difficulty,
        used_ids=state.used_question_ids,
        user_last_50=user_last_50,
        topic=body.topic,
        domain=resolved_domain,
        force_bank_only=True,  # Q1 must come from the curated bank
    )
    q_id = str(question["_id"])
    state.used_question_ids.add(q_id)

    # Track in session document
    await sessions_col.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"question_ids_used": q_id}},
    )

    return {
        "session_id": session_id,
        "question": question_to_dto(question),
        "mode": mode,
        "mode_config": {
            "label": config["label"],
            "session_timer": config["session_timer"],
            "per_question_timer": config["per_question_timer"],
            "hints_enabled": config["hints_enabled"],
            "camera_required": config["camera_required"],
            "rating_impact": config["rating_impact"],
        },
        "question_number": state.question_number,
        "max_questions": state.max_questions,
        "domain": resolved_domain,
    }


@router.post("/end")
async def end_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    End a session — compute final scores, update rating based on mode,
    award badges, and clean up session state.
    """
    sessions_col = get_collection("sessions")
    attempts_col = get_collection("question_attempts")

    session = await sessions_col.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your session")

    # Gather all attempts for this session
    attempts = await attempts_col.find({"session_id": session_id}).to_list(50)
    if not attempts:
        # No questions answered — mark as abandoned
        await sessions_col.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"status": "abandoned", "ended_at": datetime.utcnow()}},
        )
        remove_session_state(session_id)
        return {"status": "abandoned", "rating_delta": 0}

    # Compute session score
    composites = [a.get("scores", {}).get("composite", 0) for a in attempts]
    session_score = sum(composites) / len(composites) if composites else 0

    difficulties = [a.get("question_difficulty", 5) for a in attempts]
    avg_difficulty = sum(difficulties) / len(difficulties) if difficulties else 5

    now = datetime.utcnow()
    duration = int((now - session["started_at"]).total_seconds())

    mode = session.get("mode", "interview")
    mode_config = MODE_CONFIG.get(mode, MODE_CONFIG["interview"])
    rating_impact = mode_config["rating_impact"]

    rating_delta = 0
    new_badges: list[str] = []

    if rating_impact > 0:
        # Calculate and apply rating change (scaled by mode impact)
        raw_delta = calculate_rating_delta(session_score, avg_difficulty)
        rating_delta = int(raw_delta * rating_impact)
        rating_doc = await update_rating(user_id, rating_delta, session_id, session_score)
        new_badges = await evaluate_and_award_badges(user_id, rating_doc, session_score)
        new_rating = rating_doc["rating"]
    else:
        # Practice mode — no rating change
        rating_doc = await get_or_create_rating(user_id)
        new_rating = rating_doc.get("rating", session["rating_before"])

    # Update session document
    await sessions_col.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "status": "completed",
                "ended_at": now,
                "duration_seconds": duration,
                "total_score": round(session_score * 100, 1),
                "rating_after": new_rating,
                "rating_delta": rating_delta,
            }
        },
    )

    # Update user's last_50_question_ids
    q_ids = [str(a["question_id"]) for a in attempts]
    users_col = get_collection("users")
    await users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$push": {
                "last_50_question_ids": {
                    "$each": q_ids,
                    "$slice": -50,
                }
            }
        },
    )

    # Cleanup
    remove_session_state(session_id)

    return {
        "status": "completed",
        "total_score": round(session_score * 100, 1),
        "rating_delta": rating_delta,
        "new_rating": new_rating,
        "new_badges": new_badges,
        "questions_answered": len(attempts),
        "duration_seconds": duration,
        "mode": mode,
    }


@router.get("")
async def list_sessions(
    page: int = 1,
    limit: int = 10,
    mode: str | None = None,
    domain: str | None = None,
    user_id: str = Depends(get_current_user),
):
    """List the user's past sessions with pagination and optional filters."""
    col = get_collection("sessions")
    skip = (page - 1) * limit

    query: dict = {"user_id": user_id, "status": {"$ne": "active"}}
    if mode:
        query["mode"] = mode
    if domain:
        query["domain"] = resolve_domain(domain)

    total = await col.count_documents(query)
    cursor = col.find(query).sort("started_at", -1).skip(skip).limit(limit)

    sessions = []
    async for doc in cursor:
        # Count attempts for this session
        attempts_count = await get_collection("question_attempts").count_documents(
            {"session_id": str(doc["_id"])}
        )
        doc["_id"] = str(doc["_id"])
        sessions.append({
            **doc,
            "questions_answered": attempts_count,
        })

    return {"sessions": sessions, "total": total, "page": page, "limit": limit}


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get a single session with all its attempts."""
    sessions_col = get_collection("sessions")
    session = await sessions_col.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your session")

    session["_id"] = str(session["_id"])

    # Get all attempts
    attempts_col = get_collection("question_attempts")
    attempts = await attempts_col.find({"session_id": session_id}).to_list(50)
    for a in attempts:
        a["_id"] = str(a["_id"])

    # Include mode config for UI
    mode = session.get("mode", "interview")
    config = MODE_CONFIG.get(mode, MODE_CONFIG["interview"])

    return {
        "session": session,
        "attempts": attempts,
        "mode_config": {
            "label": config["label"],
            "hints_enabled": config["hints_enabled"],
            "rating_impact": config["rating_impact"],
        },
    }


# ── Admin / Test endpoint (no auth) ──────────────────────────────

from pydantic import BaseModel as PydanticBaseModel


class TestGenerateRequest(PydanticBaseModel):
    domain: str = "Machine Learning"
    topic: str | None = None
    difficulty: str = "medium"  # easy, medium, hard


@router.post("/test-generate")
async def test_generate_question(body: TestGenerateRequest):
    """
    Generate a single question via Gemini for admin panel testing.
    No auth required — this is a dev/debug endpoint.
    """
    diff_map = {"easy": 4, "medium": 10, "hard": 16}
    difficulty_num = diff_map.get(body.difficulty, 10)

    try:
        result = await gemini_generate(
            difficulty=difficulty_num,
            topic=body.topic or None,
            domain=body.domain,
        )
        # Serialise datetime fields to string
        if "created_at" in result:
            result["created_at"] = str(result["created_at"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {e}")

