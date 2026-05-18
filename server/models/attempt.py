"""Question attempt models."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class EmotionFrame(BaseModel):
    t: int = 0
    emotion: str = "neutral"
    confidence: float = 0.5


class Scores(BaseModel):
    semantic_similarity: float = 0.0
    keyword_coverage: float = 0.0
    cross_encoder_score: float = 0.0
    confidence_score: float = 0.5
    composite: float = 0.0


class AttemptSubmit(BaseModel):
    """Body for POST /api/attempts/submit."""
    session_id: str
    question_id: str
    transcript: str
    answer_duration: int = 0
    emotion_frames: list[EmotionFrame] = []


class QuestionAttempt(BaseModel):
    """Attempt document stored in MongoDB."""
    id: str = Field(default="", alias="_id")
    session_id: str = ""
    user_id: str = ""
    question_id: str = ""
    question_text: str = ""
    question_difficulty: int = 5
    bloom_level: str = "understand"
    user_answer_transcript: str = ""
    answer_duration_seconds: int = 0
    scores: Scores = Field(default_factory=Scores)
    emotion_timeline: list[EmotionFrame] = []
    dominant_emotion: str = "neutral"
    feedback: str = ""
    attempted_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class AttemptResponse(BaseModel):
    """Return value after submitting an attempt."""
    scores: Scores
    feedback: str = ""
    next_question: Optional[dict] = None  # QuestionDTO as dict, None if session complete
    session_complete: bool = False
    rating_delta: Optional[int] = None
    new_badges: list[str] = []
