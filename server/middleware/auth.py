"""
JWT authentication middleware.

Usage in handlers:
    from server.middleware.auth import get_current_user
    
    @router.get("/me")
    async def me(user_id: str = Depends(get_current_user)):
        ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from server.config.config import get_settings

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """
    Validate the JWT from the Authorization header.
    Returns the `sub` claim (user_id as string).
    """
    settings = get_settings()
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=["HS256"],
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing 'sub' claim",
            )
        return user_id
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


def create_access_token(user_id: str, extra: dict | None = None) -> str:
    """Create a JWT for the given user ID. Used by auth endpoints."""
    settings = get_settings()
    payload = {"sub": user_id}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")
