from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.services.category_service import (
    create_category,
    delete_category,
    get_categories,
    update_category,
)

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all categories — system defaults plus user-created."""
    categories = await get_categories(db, user.id)  # type: ignore[arg-type]
    return [CategoryRead.model_validate(c) for c in categories]


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_new_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new user-owned category."""
    category = await create_category(
        db,
        user.id,  # type: ignore[arg-type]
        name=body.name,
        icon=body.icon,
        colour=body.colour,
        parent_id=body.parent_id,
        budget_monthly=body.budget_monthly,
    )
    await db.commit()
    return CategoryRead.model_validate(category)


@router.patch("/{category_id}", response_model=CategoryRead)
async def update_existing_category(
    category_id: UUID,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update a user-owned category. System categories cannot be modified."""
    category = await update_category(
        db,
        category_id,
        user.id,  # type: ignore[arg-type]
        **body.model_dump(exclude_unset=True),
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or cannot be modified",
        )
    await db.commit()
    return CategoryRead.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete a user-owned category. System categories cannot be deleted."""
    deleted = await delete_category(db, category_id, user.id)  # type: ignore[arg-type]
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or cannot be deleted",
        )
    await db.commit()
