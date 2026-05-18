"""
Configuration — loads environment variables via pydantic-settings.
"""

from pathlib import Path

from pydantic_settings import BaseSettings
from functools import lru_cache

# Resolve the .env file relative to the server/ directory (two levels up from this file)
_SERVER_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _SERVER_DIR / ".env"


class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    db_name: str = "gamified_interview_2"

    # Auth
    secret_key: str = "interview-trainer-secret-key-change-in-production"

    # External services
    ml_service_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    cloudinary_url: str = ""

    # Ollama (primary for feedback, Gemini is fallback)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"

    # Server
    port: int = 8080

    model_config = {"env_file": str(_ENV_FILE), "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
