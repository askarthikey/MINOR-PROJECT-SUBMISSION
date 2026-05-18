"""Session models."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    """Body for POST /api/sessions/start."""
    mode: str = "interview"  # interview | practice
    domain: str = "javascript"
    topic: Optional[str] = None


class Session(BaseModel):
    """Session document in MongoDB."""
    id: str = Field(default="", alias="_id")
    user_id: str = ""
    mode: str = "interview"
    domain: str = "javascript"
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration_seconds: int = 0
    rating_before: int = 0
    rating_after: int = 0
    rating_delta: int = 0
    question_ids_used: list[str] = []
    total_score: float = 0.0
    status: str = "active"  # active | completed | abandoned

    model_config = {"populate_by_name": True}


class SessionSummary(BaseModel):
    """Summary returned to the frontend."""
    id: str
    mode: str
    domain: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: int = 0
    rating_before: int = 0
    rating_after: int = 0
    rating_delta: int = 0
    total_score: float = 0.0
    status: str = "active"
    questions_answered: int = 0


class SessionStartResponse(BaseModel):
    """Response from POST /api/sessions/start."""
    session_id: str
    question: dict  # QuestionDTO as dict
    session_timer: int = 1800  # 30 minutes
