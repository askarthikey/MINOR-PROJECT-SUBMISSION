"""
Scoring service — calls the ML service /score_answer endpoint.
"""

from __future__ import annotations

import httpx

from server.config.config import get_settings


async def score_answer(
    user_answer: str,
    expected_answer: str,
    keywords: list[str],
    emotion_timeline: list[dict],
) -> dict:
    """
    Forward answer data to the ML service for scoring.

    Returns dict with:
        semantic_similarity, keyword_coverage, cross_encoder_score,
        confidence_score, composite, dominant_emotion
    """
    settings = get_settings()
    payload = {
        "user_answer": user_answer,
        "expected_answer": expected_answer,
        "keywords": keywords,
        "emotion_timeline": emotion_timeline,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{settings.ml_service_url}/score_answer",
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


async def check_ml_health() -> bool:
    """Check if the ML service is ready (models loaded)."""
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.ml_service_url}/health")
            data = resp.json()
            return data.get("ready", False)
    except Exception:
        return False
