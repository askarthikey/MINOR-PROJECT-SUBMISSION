"""
Profile handler — CRUD for user profiles + resume upload.
Updated for multi-domain onboarding.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

import cloudinary
import cloudinary.uploader
import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from server.config.config import get_settings
from server.db.mongo import get_collection
from server.middleware.auth import get_current_user
from server.models.user import OnboardingData, UserProfileUpdate
from server.services.rating_service import get_or_create_rating

router = APIRouter(prefix="/api/profile", tags=["profile"])


# ── Skill → Domain mapping ────────────────────────────────────────
SKILL_TO_DOMAIN: dict[str, list[str]] = {
    "javascript": [
        "javascript", "typescript", "react", "next.js", "vue.js", "angular",
        "svelte", "node.js", "express", "nestjs", "jquery", "redux", "zustand",
        "html", "css", "tailwind", "bootstrap", "webpack", "vite", "npm",
        "yarn", "pnpm", "deno", "bun", "jest", "mocha", "cypress",
        "gatsby", "nuxt.js", "remix", "astro", "three.js", "framer motion",
        "storybook", "material ui", "chakra ui", "ant design",
    ],
    "Machine Learning": [
        "tensorflow", "pytorch", "scikit-learn", "keras", "opencv", "pandas",
        "numpy", "matplotlib", "seaborn", "plotly", "hugging face", "langchain",
        "spacy", "nltk", "xgboost", "lightgbm", "catboost", "mlflow",
        "weights & biases", "apache spark", "pyspark", "sagemaker", "vertex ai",
        "onnx", "tensorrt", "stable diffusion", "dall-e", "gpt", "bert",
        "transformers", "yolo", "detectron2", "mediapipe", "deepface",
        "jupyter", "colab", "anaconda", "scipy", "statsmodels",
        "deep learning", "neural network", "cnn", "rnn", "nlp",
        "reinforcement learning", "computer vision", "machine learning",
    ],
    "Operating Systems": [
        "linux", "unix", "windows", "macos", "rtos", "freertos", "zephyr",
        "mbed", "embedded", "kernel", "process", "thread", "scheduling",
        "memory management", "virtual memory", "paging", "deadlock",
        "semaphore", "mutex", "file system", "system call",
        "arm", "risc-v", "assembly", "shell", "bash", "powershell",
    ],
    "Computer Networks": [
        "tcp", "ip", "http", "https", "dns", "dhcp", "arp", "nat",
        "routing", "subnetting", "socket", "websocket", "webrtc",
        "rest api", "grpc", "graphql", "nginx", "apache", "haproxy",
        "traefik", "caddy", "vpn", "firewall", "ssl", "tls",
        "wireshark", "nmap", "network", "osi",
        "mqtt", "zigbee", "lora", "ble", "can bus",
    ],
    "OOPs": [
        "java", "c++", "c#", "kotlin", "swift", "scala",
        "oop", "object oriented", "encapsulation", "abstraction",
        "inheritance", "polymorphism", "solid", "design pattern",
        "singleton", "factory", "observer", "strategy", "decorator",
        "builder", "abstract class", "interface", "access modifier",
        "dependency injection", "uml",
    ],
    "DBMS": [
        "sql", "mysql", "postgresql", "mongodb", "redis", "sqlite",
        "cassandra", "dynamodb", "firebase", "prisma", "elasticsearch",
        "neo4j", "couchdb", "mariadb", "oracle", "sql server",
        "influxdb", "timescaledb", "pinecone", "weaviate", "chromadb",
        "normalization", "indexing", "b-tree", "transaction", "acid",
        "nosql", "sharding", "replication", "query optimization",
        "database", "dbms", "er model",
    ],
}


def infer_domains_from_skills(skills: list[str]) -> list[dict]:
    """Map user skills to practice domain suggestions with match counts."""
    if not skills:
        return []

    skill_lower = [s.lower().strip() for s in skills]
    domain_scores: dict[str, list[str]] = {}

    for domain_id, domain_keywords in SKILL_TO_DOMAIN.items():
        matched = []
        for skill in skill_lower:
            for kw in domain_keywords:
                if kw in skill or skill in kw:
                    matched.append(skill)
                    break
        if matched:
            domain_scores[domain_id] = list(set(matched))

    # Sort by match count descending
    results = []
    for domain_id, matched_skills in sorted(
        domain_scores.items(), key=lambda x: len(x[1]), reverse=True
    ):
        results.append({
            "domain_id": domain_id,
            "matched_skills": matched_skills[:8],  # top 8
            "match_count": len(matched_skills),
        })

    return results


def _init_cloudinary():
    """Configure Cloudinary from the cloudinary:// URL in settings."""
    settings = get_settings()
    url = settings.cloudinary_url
    if not url:
        return
    # Parse cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    from urllib.parse import urlparse
    parsed = urlparse(url)
    cloudinary.config(
        cloud_name=parsed.hostname,
        api_key=parsed.username,
        api_secret=parsed.password,
        secure=True,
    )


@router.get("")
async def get_profile(user_id: str = Depends(get_current_user)):
    """Get the authenticated user's profile."""
    col = get_collection("users")
    user = await col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])

    # Get rating info too
    rating_doc = await get_or_create_rating(user_id)
    user["rating"] = rating_doc.get("rating", 1200)
    user["peak_rating"] = rating_doc.get("peak_rating", 1200)
    user["sessions_played"] = rating_doc.get("sessions_played", 0)
    user["streak_current"] = rating_doc.get("streak_current", 0)
    user["badges"] = rating_doc.get("badges", [])

    # Compute performance stats
    total_sessions = await get_collection("sessions").count_documents(
        {"user_id": user_id, "status": "completed"}
    )
    attempts_col = get_collection("question_attempts")
    total_questions = await attempts_col.count_documents({"user_id": user_id})

    # Compute average composite score across all attempts
    avg_score = 0.0
    if total_questions > 0:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "avg": {"$avg": "$scores.composite"}}},
        ]
        cursor = attempts_col.aggregate(pipeline)
        agg = await cursor.to_list(length=1)
        if agg and agg[0].get("avg") is not None:
            avg_score = agg[0]["avg"]

    user["stats"] = {
        "total_sessions": total_sessions,
        "total_questions": total_questions,
        "avg_score": avg_score,
    }

    # Compute suggested domains from skills if not already stored
    skills = user.get("skills", [])
    if skills and not user.get("suggested_domains"):
        user["suggested_domains"] = infer_domains_from_skills(skills)

    return user


@router.put("")
async def update_profile(
    body: UserProfileUpdate,
    user_id: str = Depends(get_current_user),
):
    """Update profile fields."""
    col = get_collection("users")
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Convert DomainPreference objects to dicts if present
    if "domain_preferences" in update_data:
        update_data["domain_preferences"] = [
            dp if isinstance(dp, dict) else dp
            for dp in update_data["domain_preferences"]
        ]

    update_data["updated_at"] = datetime.utcnow()

    result = await col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or no changes")
    return {"ok": True}


@router.post("/onboard")
async def complete_onboarding(
    body: OnboardingData,
    user_id: str = Depends(get_current_user),
):
    """
    Complete the onboarding wizard.
    Sets onboarding_complete=True and the initial rating based on experience level.
    """
    col = get_collection("users")

    # Map experience level to initial rating
    level_to_rating = {
        "beginner": 800,
        "intermediate": 1200,
        "advanced": 1800,
    }
    initial_rating = level_to_rating.get(body.experience_level, 1200)

    update_data = body.model_dump()
    # Convert DomainPreference objects to dicts
    if "domain_preferences" in update_data:
        update_data["domain_preferences"] = [
            dp if isinstance(dp, dict) else dp
            for dp in update_data["domain_preferences"]
        ]

    update_data["onboarding_complete"] = True
    update_data["updated_at"] = datetime.utcnow()

    await col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
    )

    # Set initial rating
    await get_or_create_rating(user_id, initial_rating=initial_rating)

    return {"ok": True, "initial_rating": initial_rating}


@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """
    Upload resume PDF → Cloudinary → ML /parse_resume → store parsed data in profile.
    Also infers suggested practice domains from parsed skills.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    pdf_bytes = await file.read()
    settings = get_settings()

    # 1. Upload to Cloudinary
    resume_url = ""
    try:
        _init_cloudinary()
        upload_result = cloudinary.uploader.upload(
            pdf_bytes,
            resource_type="raw",
            folder="resumes",
            public_id=f"resume_{user_id}",
        )
        resume_url = upload_result.get("secure_url", "")
    except Exception as e:
        print(f"⚠️ Cloudinary upload failed: {e}")

    # 2. Parse via ML service
    parsed = {}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{settings.ml_service_url}/parse_resume",
                files={"file": (file.filename, pdf_bytes, "application/pdf")},
            )
            if resp.status_code == 200:
                parsed = resp.json()
    except Exception as e:
        print(f"⚠️ Resume parsing failed: {e}")

    # 3. Store resume URL + parsed data in user profile
    col = get_collection("users")
    update_fields: dict = {"updated_at": datetime.utcnow()}

    if resume_url:
        update_fields["resume_url"] = resume_url

    # Store parsed data fields if available
    if parsed:
        if parsed.get("skills"):
            update_fields["skills"] = parsed["skills"]
            # Infer suggested domains from skills
            suggested = infer_domains_from_skills(parsed["skills"])
            if suggested:
                update_fields["suggested_domains"] = suggested

        if parsed.get("education"):
            update_fields["education"] = parsed["education"]
        if parsed.get("experience"):
            update_fields["experience"] = parsed["experience"]
        if parsed.get("projects"):
            update_fields["projects"] = parsed["projects"]
        if parsed.get("basic_info"):
            bio = parsed["basic_info"].get("bio", "")
            if bio:
                update_fields["bio"] = bio

        # Also update name from resume if user hasn't set one
        if parsed.get("basic_info"):
            # We'll check if the user currently has no name or a default name
            user = await col.find_one({"_id": ObjectId(user_id)})
            current_name = user.get("name", "") if user else ""
            # Only auto-fill name if it's empty or "Anonymous"
            if not current_name or current_name.lower() in ("anonymous", ""):
                # Try to get name from basic_info — it might be stored differently
                # depending on the parser version
                resume_name = ""
                basic = parsed["basic_info"]
                if isinstance(basic, dict):
                    resume_name = basic.get("name", "")
                if not resume_name and parsed.get("name"):
                    resume_name = parsed["name"]
                if resume_name:
                    update_fields["name"] = resume_name

    await col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields},
    )

    return {"resume_url": resume_url, "parsed": parsed}
