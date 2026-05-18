"""Question models."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class Question(BaseModel):
    """Question stored in question_bank collection."""
    id: str = Field(default="", alias="_id")
    domain: str = "javascript"
    topic: str = ""
    subtopic: str = ""
    difficulty_rating: int = 5
    bloom_level: str = "understand"  # remember|understand|apply|analyze|evaluate|create
    question_text: str = ""
    expected_answer: str = ""
    keywords: list[str] = []
    follow_up_hints: list[str] = []
    common_mistakes: list[str] = []
    question_type: str = "conceptual"  # conceptual|scenario|debug|design
    generated_by: str = "seed"  # seed|gemini|ollama
    session_usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class QuestionDTO(BaseModel):
    """Question data sent to the frontend (hides expected_answer)."""
    id: str
    topic: str
    subtopic: str = ""
    difficulty_rating: int
    bloom_level: str
    question_text: str
    question_type: str


class GenerateQuestionRequest(BaseModel):
    """Internal request to generate a question via Gemini."""
    topic: str
    bloom_level: str
    difficulty: int
    question_type: Optional[str] = None
