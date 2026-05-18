"""
Gemini + Ollama service — question generation and post-answer feedback.
Feedback: Ollama (primary, local) → Gemini (fallback, cloud).
Question generation: Gemini only.
Supports multiple domains: JavaScript, Machine Learning, OS, CN, OOPs, DBMS.
"""

from __future__ import annotations

import asyncio
import json
import random
from datetime import datetime

import google.generativeai as genai

from server.config.config import get_settings

# Semaphore to limit concurrent Gemini calls (rate-limit protection)
_sem = asyncio.Semaphore(10)

# ── Domain Topics ──────────────────────────────────────────────────

DOMAIN_TOPICS: dict[str, list[str]] = {
    "javascript": [
        "closures", "scope", "hoisting", "prototypes", "prototype-chain",
        "promises", "async-await", "event-loop", "call-stack", "callbacks",
        "this-keyword", "arrow-functions", "destructuring", "spread-rest",
        "modules-esm", "array-methods", "higher-order-functions",
        "generators-iterators", "proxy-reflect", "WeakMap-WeakSet",
        "memory-management", "garbage-collection", "DOM-manipulation",
        "event-delegation", "debounce-throttle", "currying",
        "IIFE", "memoization", "recursion", "design-patterns-js",
        "typescript-basics", "node-event-emitter", "error-handling",
    ],
    "Machine Learning": [
        "supervised-learning", "unsupervised-learning", "deep-learning",
        "neural-networks", "CNNs", "RNNs", "transformers", "NLP",
        "reinforcement-learning", "feature-engineering", "regularization",
        "bias-variance", "ensemble-methods", "gradient-descent",
        "loss-functions", "evaluation-metrics", "cross-validation",
        "dimensionality-reduction", "clustering", "MLOps",
        "model-deployment", "transfer-learning", "GANs",
    ],
    "Operating Systems": [
        "process-management", "threads", "CPU-scheduling",
        "memory-management", "virtual-memory", "paging", "segmentation",
        "deadlocks", "synchronization", "semaphores", "mutex",
        "file-systems", "disk-scheduling", "IPC", "system-calls",
        "context-switching", "page-replacement",
    ],
    "Computer Networks": [
        "OSI-model", "TCP-IP", "HTTP", "DNS", "routing",
        "IP-addressing", "subnetting", "TLS-SSL", "ARP",
        "congestion-control", "flow-control", "NAT",
        "websockets", "REST-API", "network-security",
        "data-link-layer", "BGP", "IPv6",
    ],
    "OOPs": [
        "encapsulation", "abstraction", "inheritance", "polymorphism",
        "SOLID-principles", "design-patterns", "singleton",
        "factory-pattern", "observer-pattern", "strategy-pattern",
        "decorator-pattern", "builder-pattern", "composition-vs-inheritance",
        "abstract-classes", "interfaces", "access-modifiers",
        "dependency-injection",
    ],
    "DBMS": [
        "normalization", "SQL-joins", "transactions", "ACID",
        "indexing", "B-tree", "hashing", "query-optimization",
        "isolation-levels", "deadlocks", "views",
        "stored-procedures", "triggers", "NoSQL",
        "MongoDB", "sharding", "replication",
        "ER-model", "window-functions", "WAL",
    ],
}

# Keep backward-compatible alias
JS_TOPICS = DOMAIN_TOPICS["javascript"]

BLOOM_LEVELS = {
    "remember": (1, 3, "Recall basic facts and definitions"),
    "understand": (4, 6, "Explain concepts in own words"),
    "apply": (7, 9, "Use knowledge in new situations"),
    "analyze": (10, 13, "Break down and examine execution"),
    "evaluate": (14, 17, "Compare, judge, and justify"),
    "create": (18, 20, "Design and build new solutions"),
}

DOMAIN_LABELS = {
    "javascript": "JavaScript",
    "Machine Learning": "Machine Learning",
    "Operating Systems": "Operating Systems",
    "Computer Networks": "Computer Networks",
    "OOPs": "Object-Oriented Programming",
    "DBMS": "Database Management Systems",
}


def _difficulty_to_bloom(difficulty: int) -> str:
    """Map a difficulty level to the appropriate Bloom level."""
    for bloom, (lo, hi, _) in BLOOM_LEVELS.items():
        if lo <= difficulty <= hi:
            return bloom
    return "create" if difficulty > 17 else "remember"


def _init_genai():
    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)


QUESTION_GEN_PROMPT = """You are a senior technical interview question generator.

Generate ONE interview question with the following spec:
- Domain: {domain_label}
- Topic: {topic}
- Bloom's Taxonomy Level: {bloom_level} ({bloom_description})
- Difficulty: {difficulty}/20
- Question Type: {question_type}

Return ONLY valid JSON (no markdown, no explanation, no code fences):
{{
  "question_text": "...",
  "expected_answer": "Detailed model answer (3-5 sentences minimum)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "follow_up_hints": ["hint1", "hint2"],
  "common_mistakes": ["mistake1", "mistake2"],
  "bloom_level": "{bloom_level}",
  "question_type": "conceptual|scenario|debug|design"
}}
"""


async def generate_question(
    difficulty: int,
    topic: str | None = None,
    question_type: str | None = None,
    domain: str = "javascript",
) -> dict:
    """Generate a question via Gemini and return it as a dict (no DB insert)."""
    _init_genai()
    settings = get_settings()

    domain_topics = DOMAIN_TOPICS.get(domain, DOMAIN_TOPICS["javascript"])
    domain_label = DOMAIN_LABELS.get(domain, domain)

    if not topic:
        topic = random.choice(domain_topics)

    bloom_level = _difficulty_to_bloom(difficulty)
    _, _, bloom_desc = BLOOM_LEVELS[bloom_level]

    if not question_type:
        question_type = random.choice(["conceptual", "scenario", "debug", "design"])

    prompt = QUESTION_GEN_PROMPT.format(
        domain_label=domain_label,
        topic=topic,
        bloom_level=bloom_level,
        bloom_description=bloom_desc,
        difficulty=difficulty,
        question_type=question_type,
    )

    async with _sem:
        model = genai.GenerativeModel(settings.gemini_model)
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )

    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    text = text.strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Fallback: create a simple question
        data = {
            "question_text": f"Explain the concept of {topic} in {domain_label}.",
            "expected_answer": f"{topic} is a fundamental {domain_label} concept. Explain how it works, its use cases, and common pitfalls.",
            "keywords": [topic, domain_label.lower()],
            "follow_up_hints": ["Can you give an example?"],
            "common_mistakes": ["Oversimplifying the concept"],
            "bloom_level": bloom_level,
            "question_type": question_type,
        }

    # Enrich with metadata
    data["domain"] = domain
    data["topic"] = topic
    data["subtopic"] = ""
    data["difficulty_rating"] = difficulty
    data["bloom_level"] = bloom_level
    data["generated_by"] = "gemini"
    data["session_usage_count"] = 0
    data["created_at"] = datetime.utcnow()

    return data


FEEDBACK_PROMPT = """You are an interview coach for {domain_label}.
Question: {question}
User answer: {user_answer}
Expected: {expected_answer}
Scores: Semantic {semantic:.0%}, Keywords {keyword:.0%}

Provide EXACTLY 2 lines of comprehensive feedback. Do not use lists or bullet points. Just write 2 lines of solid, direct explanation.
Line 1: Detailed analysis of their answer based on the expected answer.
Line 2: The exact technical correction or the missing key concept they should have mentioned."""


# ── Ollama feedback (primary) ─────────────────────────────────────

async def _generate_feedback_ollama(prompt: str) -> str:
    """Generate feedback via local Ollama. Raises on failure."""
    import httpx

    settings = get_settings()
    ollama_url = f"{settings.ollama_base_url}/api/generate"

    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.5,
            "num_predict": 128,
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(ollama_url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        text = data.get("response", "").strip()
        if not text:
            raise ValueError("Empty response from Ollama")
        return text


# ── Gemini feedback (fallback) ────────────────────────────────────

async def _generate_feedback_gemini(prompt: str) -> str:
    """Generate feedback via Gemini API. Raises on failure."""
    _init_genai()
    settings = get_settings()

    async with _sem:
        model = genai.GenerativeModel(settings.gemini_model)
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.5,
                max_output_tokens=256,
            ),
        )
    return response.text.strip()


# ── Public API ────────────────────────────────────────────────────

async def generate_feedback(
    question: str,
    user_answer: str,
    expected_answer: str,
    semantic_score: float,
    keyword_score: float,
    domain: str = "javascript",
) -> str:
    """
    Generate per-question feedback.

    Strategy: Ollama (local, fast) → Gemini (cloud fallback).
    """
    domain_label = DOMAIN_LABELS.get(domain, domain)

    prompt = FEEDBACK_PROMPT.format(
        domain_label=domain_label,
        question=question,
        user_answer=user_answer,
        expected_answer=expected_answer,
        semantic=semantic_score,
        keyword=keyword_score,
    )

    # 1. Try Ollama first (local, no rate-limits, free)
    try:
        result = await _generate_feedback_ollama(prompt)
        print("  ✅ Feedback via Ollama")
        return result
    except Exception as ollama_err:
        print(f"  ⚠️ Ollama feedback failed: {ollama_err}, falling back to Gemini")

    # 2. Fallback to Gemini
    try:
        result = await _generate_feedback_gemini(prompt)
        print("  ✅ Feedback via Gemini (fallback)")
        return result
    except Exception as gemini_err:
        return f"Feedback generation failed: Ollama ({ollama_err}), Gemini ({gemini_err})"

