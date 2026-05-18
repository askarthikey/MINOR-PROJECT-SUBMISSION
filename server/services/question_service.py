"""
Question service — fetching, de-duplication, and generation fallback.
Supports multiple domains: JavaScript, Machine Learning, OS, CN, OOPs, DBMS.
"""

from __future__ import annotations

import random

from bson import ObjectId

from server.db.mongo import get_collection
from server.services.gemini_service import generate_question, DOMAIN_TOPICS


# Map domain display names to their DB field values
DOMAIN_MAP = {
    "javascript": "javascript",
    "js": "javascript",
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "os": "Operating Systems",
    "operating systems": "Operating Systems",
    "cn": "Computer Networks",
    "computer networks": "Computer Networks",
    "oops": "OOPs",
    "oop": "OOPs",
    "dbms": "DBMS",
}

AVAILABLE_DOMAINS = [
    {"id": "javascript", "label": "JavaScript", "icon": "🟨"},
    {"id": "Machine Learning", "label": "Machine Learning", "icon": "🤖"},
    {"id": "Operating Systems", "label": "Operating Systems", "icon": "🖥️"},
    {"id": "Computer Networks", "label": "Computer Networks", "icon": "🌐"},
    {"id": "OOPs", "label": "OOPs", "icon": "🧱"},
    {"id": "DBMS", "label": "DBMS", "icon": "🗄️"},
]


def resolve_domain(domain: str | None) -> str:
    """Resolve user-facing domain name to DB domain value."""
    if not domain:
        return "javascript"
    return DOMAIN_MAP.get(domain.lower(), domain)


async def get_next_question(
    difficulty: int,
    used_ids: set[str],
    user_last_50: list[str] | None = None,
    topic: str | None = None,
    domain: str | None = None,
    force_bank_only: bool = False,
) -> dict:
    """
    Fetch a question from the question_bank matching the difficulty and domain.

    1. Query MongoDB with difficulty range ± 1, excluding used IDs.
    2. If no match, widen to ± 3.
    3. If force_bank_only: widen further (any difficulty, drop topic filter).
    4. If still no match and NOT force_bank_only: generate via Gemini and store.
    5. Return the question document.
    """
    col = get_collection("question_bank")
    resolved_domain = resolve_domain(domain)

    # Combine in-session and cross-session used IDs
    all_used = list(used_ids)
    if user_last_50:
        all_used.extend(user_last_50)

    # Convert to ObjectIds where valid
    exclude_oids = []
    for uid in all_used:
        try:
            exclude_oids.append(ObjectId(uid))
        except Exception:
            pass

    # Build match filter — try both 'difficulty_rating' and 'rating' fields
    match_filter: dict = {
        "domain": resolved_domain,
        "$or": [
            {"difficulty_rating": {"$gte": max(1, difficulty - 1), "$lte": min(20, difficulty + 1)}},
            {"rating": {"$gte": max(1, difficulty - 1), "$lte": min(20, difficulty + 1)}},
        ],
    }
    if exclude_oids:
        match_filter["_id"] = {"$nin": exclude_oids}
    if topic:
        match_filter["topic"] = topic

    pipeline = [
        {"$match": match_filter},
        {"$sample": {"size": 5}},
    ]

    candidates = await col.aggregate(pipeline).to_list(5)

    # Widen search if no results — ± 3
    if not candidates:
        match_filter["$or"] = [
            {"difficulty_rating": {"$gte": max(1, difficulty - 3), "$lte": min(20, difficulty + 3)}},
            {"rating": {"$gte": max(1, difficulty - 3), "$lte": min(20, difficulty + 3)}},
        ]
        if topic:
            del match_filter["topic"]  # drop topic filter for wider search
        pipeline = [{"$match": match_filter}, {"$sample": {"size": 5}}]
        candidates = await col.aggregate(pipeline).to_list(5)

    # If force_bank_only, try even wider — any difficulty, drop topic filter
    if not candidates and force_bank_only:
        wide_filter: dict = {"domain": resolved_domain}
        if exclude_oids:
            wide_filter["_id"] = {"$nin": exclude_oids}
        pipeline = [{"$match": wide_filter}, {"$sample": {"size": 5}}]
        candidates = await col.aggregate(pipeline).to_list(5)

    if candidates:
        chosen = random.choice(candidates)
        chosen["_id"] = str(chosen["_id"])
        # Increment usage count (fire-and-forget)
        try:
            await col.update_one(
                {"_id": ObjectId(chosen["_id"])},
                {"$inc": {"session_usage_count": 1}},
            )
        except Exception:
            pass
        return chosen

    # ── Fallback: generate via Gemini (only if not force_bank_only) ──
    try:
        domain_topics = DOMAIN_TOPICS.get(resolved_domain, DOMAIN_TOPICS["javascript"])
        generated = await generate_question(
            difficulty=difficulty,
            topic=topic or random.choice(domain_topics),
            domain=resolved_domain,
        )
        result = await col.insert_one(generated)
        generated["_id"] = str(result.inserted_id)
        return generated
    except Exception as e:
        print(f"⚠️ Gemini question generation failed: {e}")
        # Last resort: return any question from the domain
        any_filter: dict = {"domain": resolved_domain}
        if exclude_oids:
            any_filter["_id"] = {"$nin": exclude_oids}
        fallback = await col.aggregate(
            [{"$match": any_filter}, {"$sample": {"size": 1}}]
        ).to_list(1)
        if fallback:
            chosen = fallback[0]
            chosen["_id"] = str(chosen["_id"])
            return chosen
        # Absolute last resort: static placeholder
        return {
            "_id": str(ObjectId()),
            "domain": resolved_domain,
            "topic": topic or "general",
            "subtopic": "",
            "difficulty_rating": difficulty,
            "bloom_level": "understand",
            "question_text": f"Explain a core concept in {resolved_domain} that you find most important.",
            "expected_answer": "The candidate should discuss fundamental concepts relevant to the domain.",
            "keywords": [resolved_domain.lower()],
            "question_type": "conceptual",
            "generated_by": "fallback",
            "session_usage_count": 0,
        }


def question_to_dto(q: dict) -> dict:
    """Convert a full question document to the frontend-safe DTO (hides answers)."""
    return {
        "id": str(q.get("_id", "")),
        "domain": q.get("domain", ""),
        "topic": q.get("topic", q.get("subdomain", "")),
        "subtopic": q.get("subtopic", ""),
        "difficulty_rating": q.get("difficulty_rating", q.get("rating", 5)),
        "bloom_level": q.get("bloom_level", "understand"),
        "question_text": q.get("question_text", q.get("question", "")),
        "question_type": q.get("question_type", "conceptual"),
    }
