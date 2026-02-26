from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_access_token, hash_password


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get the current authenticated user.

    If auth_required is False (V1 single-user mode), create or fetch a
    default user automatically.

    If auth_required is True, extract the Bearer token from the
    Authorization header, decode the JWT, and fetch the user from the DB.
    """
    if not settings.auth_required:
        # V1 single-user mode: use a default user
        query = select(User).where(User.email == "default@vault.local")
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        if user is None:
            user = User(
                email="default@vault.local",
                name="Default User",
                password_hash=hash_password("default"),
                currency="GBP",
            )
            db.add(user)
            await db.flush()
            await db.refresh(user)
        return user

    # Auth required: extract Bearer token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.removeprefix("Bearer ").strip()
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
