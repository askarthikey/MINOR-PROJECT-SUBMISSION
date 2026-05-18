"""
Interview Trainer — ML Service

Entry point: uvicorn ml.main:app --port 8000 --reload

Loads HuggingFace models at startup:
  - Facial Emotion ViT: dima806/facial_emotions_image_detection
  - Bi-Encoder: sentence-transformers/all-MiniLM-L6-v2
  - Cross-Encoder: cross-encoder/ms-marco-MiniLM-L6-v2
"""

from __future__ import annotations

import io
import os
from collections import Counter
from contextlib import asynccontextmanager
from pathlib import Path

# Load environment variables from ml/.env
_env_path = Path(__file__).resolve().parent / ".env"
if _env_path.exists():
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                os.environ.setdefault(_key.strip(), _val.strip())

import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from sklearn.metrics.pairwise import cosine_similarity

# ── Global model references ───────────────────────────────────────
emotion_pipe = None
bi_encoder = None
cross_encoder = None
models_ready = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global emotion_pipe, bi_encoder, cross_encoder, models_ready

    print("🔄 Loading ML models… (this takes 30-60 seconds on first run)")

    from transformers import pipeline as hf_pipeline
    from sentence_transformers import SentenceTransformer, CrossEncoder as CE

    # 1. Facial emotion — ViT model
    emotion_pipe = hf_pipeline(
        "image-classification",
        model="dima806/facial_emotions_image_detection",
        device=0 if torch.cuda.is_available() else -1,
    )
    print("  ✅ Emotion model loaded")

    # 2. Semantic similarity bi-encoder
    bi_encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    print("  ✅ Bi-encoder loaded")

    # 3. Cross-encoder for precision re-ranking
    cross_encoder = CE("cross-encoder/ms-marco-MiniLM-L6-v2")
    print("  ✅ Cross-encoder loaded")

    models_ready = True
    print("🚀 All ML models loaded and ready!")

    yield


app = FastAPI(title="Interview Trainer ML Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ─────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"ready": models_ready, "gpu": torch.cuda.is_available()}


# ── Emotion Analysis ──────────────────────────────────────────────

POSITIVE_EMOTIONS = {"happy", "neutral", "surprise"}
NEGATIVE_EMOTIONS = {"angry", "fear", "sad", "disgust"}


@app.post("/analyze_frame")
async def analyze_frame(frame: UploadFile = File(...)):
    """Classify facial emotion from a single JPEG/PNG frame."""
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models still loading")
    try:
        image_bytes = await frame.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        results = emotion_pipe(image)

        top = results[0]
        return {
            "emotion": top["label"],
            "confidence": round(top["score"], 3),
            "all_emotions": {r["label"]: round(r["score"], 3) for r in results},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Answer Scoring ────────────────────────────────────────────────

def emotion_to_confidence_score(emotion_timeline: list[dict]) -> float:
    """Convert emotion timeline to a 0-1 confidence score."""
    if not emotion_timeline:
        return 0.5  # neutral default when no camera
    positive_frames = sum(
        1 for e in emotion_timeline if e.get("emotion") in POSITIVE_EMOTIONS
    )
    total = len(emotion_timeline)
    base_score = positive_frames / total
    weighted = sum(
        e.get("confidence", 0.5)
        for e in emotion_timeline
        if e.get("emotion") in POSITIVE_EMOTIONS
    ) / max(total, 1)
    return round((base_score * 0.5 + weighted * 0.5), 3)


class ScoreRequest(BaseModel):
    user_answer: str
    expected_answer: str
    keywords: list[str] = []
    emotion_timeline: list[dict] = []


class ScoreResponse(BaseModel):
    semantic_similarity: float
    keyword_coverage: float
    cross_encoder_score: float
    confidence_score: float
    composite: float
    dominant_emotion: str


@app.post("/score_answer", response_model=ScoreResponse)
async def score_answer(payload: ScoreRequest):
    """Score a user's answer against the expected answer."""
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models still loading")

    user_answer = payload.user_answer.strip()
    expected_answer = payload.expected_answer
    keywords = payload.keywords
    emotion_timeline = payload.emotion_timeline

    # Handle empty answer
    if not user_answer:
        return ScoreResponse(
            semantic_similarity=0.0,
            keyword_coverage=0.0,
            cross_encoder_score=0.0,
            confidence_score=emotion_to_confidence_score(emotion_timeline),
            composite=0.0,
            dominant_emotion="neutral",
        )

    # 1. Semantic Similarity (bi-encoder) — 40% weight
    embeddings = bi_encoder.encode([user_answer, expected_answer])
    sem_score = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
    sem_score = max(0.0, min(1.0, sem_score))

    # 2. Cross-encoder Re-rank for precision — 20% weight
    cross_score_raw = cross_encoder.predict([(user_answer, expected_answer)])
    cross_score = float(1 / (1 + np.exp(-cross_score_raw[0])))  # sigmoid

    # 3. Keyword Coverage — 30% weight
    answer_lower = user_answer.lower()
    if keywords:
        covered = sum(1 for kw in keywords if kw.lower() in answer_lower)
        keyword_score = covered / len(keywords)
    else:
        keyword_score = sem_score  # fallback

    # 4. Confidence from Emotion — 10% weight
    confidence_score = emotion_to_confidence_score(emotion_timeline)

    # 5. Composite Score
    composite = (
        sem_score * 0.40
        + keyword_score * 0.30
        + cross_score * 0.20
        + confidence_score * 0.10
    )
    composite = round(min(1.0, max(0.0, composite)), 3)

    # Dominant emotion
    dominant = "neutral"
    if emotion_timeline:
        emotions = [e.get("emotion", "neutral") for e in emotion_timeline]
        dominant = Counter(emotions).most_common(1)[0][0]

    return ScoreResponse(
        semantic_similarity=round(sem_score, 3),
        keyword_coverage=round(keyword_score, 3),
        cross_encoder_score=round(cross_score, 3),
        confidence_score=round(confidence_score, 3),
        composite=composite,
        dominant_emotion=dominant,
    )


# ── Resume Parsing ────────────────────────────────────────────────

from ml.resume_parser import parse_resume_bytes


@app.post("/parse_resume")
async def parse_resume(file: UploadFile = File(...)):
    """Parse a resume PDF and return structured data."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    pdf_bytes = await file.read()

    try:
        result = parse_resume_bytes(pdf_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {e}")
