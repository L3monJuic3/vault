from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category


async def get_categories(
    db: AsyncSession, user_id: UUID | None = None
) -> list[Category]:
    """Get all categories — system defaults (user_id=NULL) + user-created."""
    query = select(Category).where(
        (Category.user_id.is_(None)) | (Category.user_id == user_id)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_category_by_id(db: AsyncSession, category_id: UUID) -> Category | None:
    """Get a single category by ID."""
    return await db.get(Category, category_id)


async def create_category(
    db: AsyncSession,
    user_id: UUID,
    *,
    name: str,
    icon: str | None = None,
    colour: str | None = None,
    parent_id: UUID | None = None,
    budget_monthly=None,
) -> Category:
    """Create a user-owned category."""
    category = Category(
        user_id=user_id,
        name=name,
        icon=icon,
        colour=colour,
        parent_id=parent_id,
        budget_monthly=budget_monthly,
    )
    db.add(category)
    await db.flush()
    return category


async def update_category(
    db: AsyncSession, category_id: UUID, user_id: UUID, **kwargs
) -> Category | None:
    """Update a category. Only user-owned categories can be updated."""
    category = await db.get(Category, category_id)
    if category is None:
        return None
    # System categories (user_id=None) cannot be updated
    if category.user_id is None:
        return None
    # User can only update their own categories
    if category.user_id != user_id:
        return None
    for key, value in kwargs.items():
        if value is not None:
            setattr(category, key, value)
    await db.flush()
    return category


async def delete_category(db: AsyncSession, category_id: UUID, user_id: UUID) -> bool:
    """Delete a category. System defaults (user_id=NULL) cannot be deleted."""
    category = await db.get(Category, category_id)
    if category is None:
        return False
    if category.user_id is None:
        return False  # Cannot delete system defaults
    if category.user_id != user_id:
        return False
    await db.delete(category)
    await db.flush()
    return True
