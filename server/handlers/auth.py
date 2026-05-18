"""
Auth handler — JWT-based login/register with password hashing.
"""

from __future__ import annotations

from datetime import datetime

import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from server.db.mongo import get_collection
from server.middleware.auth import create_access_token
from server.services.rating_service import get_or_create_rating

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


class AuthResponse(BaseModel):
    token: str
    user_id: str
    name: str
    email: str
    onboarding_complete: bool


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    """Authenticate with email + password."""
    col = get_collection("users")
    user = await col.find_one({"email": body.email})

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check password
    stored_hash = user.get("password_hash", "")
    if not stored_hash or not _verify_password(body.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token(user_id, {"email": body.email, "name": user.get("name", "")})

    return AuthResponse(
        token=token,
        user_id=user_id,
        name=user.get("name", ""),
        email=body.email,
        onboarding_complete=user.get("onboarding_complete", False),
    )


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    """Register a new user with email + password."""
    col = get_collection("users")

    # Check if email already taken
    existing = await col.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    now = datetime.utcnow()
    display_name = body.name or body.email.split("@")[0]
    new_user = {
        "email": body.email,
        "password_hash": _hash_password(body.password),
        "name": display_name,
        "avatar_url": "",
        "onboarding_complete": False,
        "js_experience_level": "beginner",
        "current_role": "",
        "college_or_company": "",
        "skills": [],
        "resume_url": "",
        "education": [],
        "experience": [],
        "projects": [],
        "last_50_question_ids": [],
        "created_at": now,
        "updated_at": now,
    }
    result = await col.insert_one(new_user)
    user_id = str(result.inserted_id)

    # Create initial rating
    await get_or_create_rating(user_id, initial_rating=1200)

    token = create_access_token(user_id, {"email": body.email, "name": display_name})
    return AuthResponse(
        token=token,
        user_id=user_id,
        name=display_name,
        email=body.email,
        onboarding_complete=False,
    )
