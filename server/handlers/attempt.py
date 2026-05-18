"""
Attempt handler — submit an answer, get scores + next question.
"""

from __future__ import annotations

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from server.db.mongo import get_collection
from server.middleware.auth import get_current_user
from server.models.attempt import AttemptSubmit
from server.services.scoring_service import score_answer
from server.services.question_service import get_next_question, question_to_dto
from server.services.gemini_service import generate_feedback
from server.services.session_state import get_session_state

router = APIRouter(prefix="/api/attempts", tags=["attempts"])


async def async_generate_and_store_feedback(
    attempt_id: ObjectId,
    question_text: str,
    transcript: str,
    expected_answer: str,
    semantic_score: float,
    keyword_score: float,
    domain: str
):
    """Background task to generate and store feedback without blocking the UI."""
    try:
        feedback = await generate_feedback(
            question=question_text,
            user_answer=transcript,
            expected_answer=expected_answer,
            semantic_score=semantic_score,
            keyword_score=keyword_score,
            domain=domain,
        )
    except Exception as e:
        feedback = "Feedback generation unavailable."
        print(f"⚠️ Background feedback generation failed: {e}")

    await get_collection("question_attempts").update_one(
        {"_id": attempt_id},
        {"$set": {"feedback": feedback}}
    )
    print(f"✅ Background feedback stored for attempt {attempt_id}")


@router.post("/submit")
async def submit_attempt(
    body: AttemptSubmit,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
):
    """
    Submit an answer for the current question.

    1. Score via ML service
    2. Store attempt in MongoDB with placeholder feedback
    3. Dispatch background task to generate actual feedback via Ollama
    4. Update n+2 difficulty
    5. Fetch next question or signal session complete
    """
    state = get_session_state(body.session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    if state.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")

    # Get the full question from DB for expected_answer and keywords
    q_col = get_collection("question_bank")
    try:
        question_doc = await q_col.find_one({"_id": ObjectId(body.question_id)})
    except Exception:
        question_doc = None

    if not question_doc:
        raise HTTPException(status_code=404, detail="Question not found")

    expected_answer = question_doc.get("expected_answer", "")
    keywords = question_doc.get("keywords", [])
    question_text = question_doc.get("question_text", "")

    # Get domain from session
    session_doc = await get_collection("sessions").find_one({"_id": ObjectId(body.session_id)})
    domain = session_doc.get("domain", "javascript") if session_doc else "javascript"

    # ── 1. Score via ML ──
    emotion_data = [e.model_dump() for e in body.emotion_frames]
    try:
        scores = await score_answer(
            user_answer=body.transcript,
            expected_answer=expected_answer,
            keywords=keywords,
            emotion_timeline=emotion_data,
        )
    except Exception as e:
        # ML service down — fallback scores
        scores = {
            "semantic_similarity": 0.5,
            "keyword_coverage": 0.3,
            "cross_encoder_score": 0.5,
            "confidence_score": 0.5,
            "composite": 0.45,
            "dominant_emotion": "neutral",
        }
        print(f"⚠️ ML scoring failed, using fallback: {e}")

    composite = scores.get("composite", 0.0)

    # ── 2. Store attempt immediately ──
    feedback_placeholder = "Generating AI feedback..."
    attempt_doc = {
        "session_id": body.session_id,
        "user_id": user_id,
        "question_id": body.question_id,
        "question_text": question_text,
        "question_difficulty": question_doc.get("difficulty_rating", 5),
        "bloom_level": question_doc.get("bloom_level", "understand"),
        "user_answer_transcript": body.transcript,
        "answer_duration_seconds": body.answer_duration,
        "scores": scores,
        "emotion_timeline": emotion_data,
        "dominant_emotion": scores.get("dominant_emotion", "neutral"),
        "feedback": feedback_placeholder,
        "attempted_at": datetime.utcnow(),
    }
    insert_res = await get_collection("question_attempts").insert_one(attempt_doc)
    attempt_id = insert_res.inserted_id

    # ── 3. Dispatch Background Feedback Generation ──
    background_tasks.add_task(
        async_generate_and_store_feedback,
        attempt_id,
        question_text,
        body.transcript,
        expected_answer,
        scores.get("semantic_similarity", 0),
        scores.get("keyword_coverage", 0),
        domain
    )

    # ── 4. Update n+2 difficulty ──
    state.set_future_difficulty(composite)

    # ── 5. Fetch next question or end ──
    session_complete = state.is_complete
    next_question = None

    if not session_complete:
        difficulty = state.advance()
        # Get user's cross-session used IDs
        users_col = get_collection("users")
        user = await users_col.find_one({"_id": ObjectId(user_id)})
        user_last_50 = user.get("last_50_question_ids", []) if user else []

        # Q1-Q2 must come from the curated bank; Q3+ can use Gemini fallback
        use_bank_only = state.question_number <= 2

        q = await get_next_question(
            difficulty=difficulty,
            used_ids=state.used_question_ids,
            user_last_50=user_last_50,
            topic=state.topic,
            domain=domain,
            force_bank_only=use_bank_only,
        )
        q_id = str(q["_id"])
        state.used_question_ids.add(q_id)

        # Track in session document
        await get_collection("sessions").update_one(
            {"_id": ObjectId(body.session_id)},
            {"$push": {"question_ids_used": q_id}},
        )
        next_question = question_to_dto(q)

    return {
        "scores": scores,
        "feedback": feedback_placeholder,
        "next_question": next_question,
        "session_complete": session_complete,
        "question_number": state.question_number,
        "max_questions": state.max_questions,
    }
