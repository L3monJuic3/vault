from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    create_user,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if email already exists
    query = select(User).where(User.email == user_data.email)
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = await create_user(
        db,
        email=user_data.email,
        name=user_data.name,
        password=user_data.password,
        currency=user_data.currency,
    )
    return user


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return a JWT access token."""
    user = await authenticate_user(db, body.email, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
async def get_me(
    user: User = Depends(get_current_user),
):
    """Return the currently authenticated user."""
    return user


@router.patch("/me", response_model=UserRead)
async def update_me(
    body: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile (name, currency)."""
    if body.name is not None:
        user.name = body.name
    if body.currency is not None:
        user.currency = body.currency
    await db.flush()
    await db.refresh(user)
    return user
