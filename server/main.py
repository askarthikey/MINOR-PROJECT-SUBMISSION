"""
Interview Trainer — FastAPI Backend

Entry point: uvicorn server.main:app --port 8080 --reload
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.config.config import get_settings
from server.db.mongo import connect_db, close_db
from server.seeds.seed import load_seed_questions

# ── Import routers ──
from server.handlers.auth import router as auth_router
from server.handlers.profile import router as profile_router
from server.handlers.session import router as session_router
from server.handlers.attempt import router as attempt_router
from server.handlers.rating import router as rating_router
from server.handlers.dashboard import router as dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown."""
    # Startup
    print("🚀 Starting Interview Trainer backend…")
    await connect_db()
    await load_seed_questions()
    print("✅ Backend ready!")

    yield

    # Shutdown
    await close_db()
    print("👋 Backend shut down.")


app = FastAPI(
    title="Interview Trainer API",
    description="Gamified JavaScript interview training platform — backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ──
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(session_router)
app.include_router(attempt_router)
app.include_router(rating_router)
app.include_router(dashboard_router)


# ── Health ──
@app.get("/health")
async def health():
    return {"status": "ok", "service": "interview-trainer-backend"}


# ── Dev: Reset DB ──
@app.post("/dev/reset")
async def reset_db():
    """Clear all collections and re-seed. Dev only."""
    from server.db.mongo import get_collection
    collections = ["users", "sessions", "question_attempts", "ratings"]
    results = {}
    for col_name in collections:
        col = get_collection(col_name)
        r = await col.delete_many({})
        results[col_name] = r.deleted_count

    # Clear and re-seed question bank
    qb = get_collection("question_bank")
    r = await qb.delete_many({})
    results["question_bank"] = r.deleted_count

    seeded = await load_seed_questions()
    results["questions_seeded"] = seeded
    return {"cleared": results}
