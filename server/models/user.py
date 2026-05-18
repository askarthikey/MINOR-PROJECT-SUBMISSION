"""User / Profile models."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Sub-documents ──────────────────────────────────────────────────


class Education(BaseModel):
    institution: str = ""
    degree: str = ""
    field: str = ""
    start_year: str = ""
    end_year: str = ""


class Experience(BaseModel):
    company: str = ""
    title: str = ""
    duration: str = ""
    description: str = ""


class Project(BaseModel):
    name: str = ""
    description: str = ""
    technologies: str = ""


class DomainPreference(BaseModel):
    """User's preference and experience level for a specific domain."""
    domain_id: str = ""           # e.g. "javascript", "Machine Learning"
    experience_level: str = "beginner"  # beginner | intermediate | advanced
    is_selected: bool = True


# ── Main documents ─────────────────────────────────────────────────


class UserCreate(BaseModel):
    """Sent from frontend on first auth."""
    email: str
    name: str
    avatar_url: str = ""


class UserProfile(BaseModel):
    """Full user profile stored in MongoDB."""
    id: str = Field(default="", alias="_id")
    email: str = ""
    name: str = ""
    avatar_url: str = ""
    onboarding_complete: bool = False
    # Legacy field kept for backward compat
    js_experience_level: str = "beginner"
    # New multi-domain preferences
    domain_preferences: list[DomainPreference] = []
    experience_level: str = "beginner"  # Overall experience
    current_role: str = ""
    college_or_company: str = ""
    skills: list[str] = []
    resume_url: str = ""
    education: list[Education] = []
    experience: list[Experience] = []
    projects: list[Project] = []
    last_50_question_ids: list[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class UserProfileUpdate(BaseModel):
    """Fields the user can update via PUT /api/profile."""
    name: Optional[str] = None
    js_experience_level: Optional[str] = None
    experience_level: Optional[str] = None
    domain_preferences: Optional[list[DomainPreference]] = None
    current_role: Optional[str] = None
    college_or_company: Optional[str] = None
    skills: Optional[list[str]] = None
    education: Optional[list[Education]] = None
    experience: Optional[list[Experience]] = None
    projects: Optional[list[Project]] = None
    onboarding_complete: Optional[bool] = None


class OnboardingData(BaseModel):
    """Payload from the onboarding wizard."""
    name: str
    experience_level: str = "beginner"  # beginner | intermediate | advanced
    domain_preferences: list[DomainPreference] = []
    current_role: str = ""
    college_or_company: str = ""
    skills: list[str] = []
    education: list = []       # Flexible: can be strings or dicts
    experience: list = []      # Flexible: can be strings or dicts
    projects: list = []        # Flexible: can be strings or dicts
    # Legacy compat
    js_experience_level: str = "beginner"
