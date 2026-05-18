"""
MongoDB connection — Motor async driver.

Usage:
    from server.db.mongo import get_db, get_collection

    db = get_db()
    users = get_collection("users")
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from server.config.config import get_settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    """Initialise the Motor client. Call once at startup."""
    global _client, _db
    settings = get_settings()
    _client = AsyncIOMotorClient(settings.mongodb_uri)
    _db = _client[settings.db_name]
    # Verify connectivity
    await _client.admin.command("ping")
    print(f"✅ Connected to MongoDB: {settings.db_name}")


async def close_db() -> None:
    """Close the Motor client. Call at shutdown."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        print("🔌 MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not initialised — call connect_db() first")
    return _db


def get_collection(name: str):
    return get_db()[name]
