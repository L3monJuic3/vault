from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a bcrypt hash."""
    password_bytes = password.encode("utf-8")
    hash_bytes = password_hash.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hash_bytes)


def create_access_token(user_id: UUID) -> str:
    """Create a JWT access token with user_id as sub, expiring in 24 hours."""
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user_id),
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> UUID | None:
    """Decode a JWT access token and return the user_id, or None if invalid."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        sub: str | None = payload.get("sub")
        if sub is None:
            return None
        return UUID(sub)
    except (JWTError, ValueError):
        return None


async def create_user(
    db: AsyncSession,
    email: str,
    name: str,
    password: str,
    currency: str = "GBP",
) -> User:
    """Create a new user with a hashed password."""
    user = User(
        email=email,
        name=name,
        password_hash=hash_password(password),
        currency=currency,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Verify credentials and return the user, or None if invalid."""
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if user is None:
        return None
    if not verify_password(password, str(user.password_hash)):
        return None
    return user
