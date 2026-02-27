from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recurring_group import RecurringGroup


async def get_subscriptions(db: AsyncSession, user_id: UUID) -> list[RecurringGroup]:
    """Get all recurring groups for a user."""
    query = (
        select(RecurringGroup)
        .where(RecurringGroup.user_id == user_id)
        .order_by(RecurringGroup.name)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_subscription_by_id(
    db: AsyncSession, subscription_id: UUID, user_id: UUID
) -> RecurringGroup | None:
    """Get a single subscription scoped to user."""
    query = select(RecurringGroup).where(
        RecurringGroup.id == subscription_id,
        RecurringGroup.user_id == user_id,
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def update_subscription(
    db: AsyncSession, subscription_id: UUID, user_id: UUID, **kwargs
) -> RecurringGroup | None:
    """Update a subscription's fields."""
    sub = await get_subscription_by_id(db, subscription_id, user_id)
    if sub is None:
        return None
    for key, value in kwargs.items():
        if value is not None:
            setattr(sub, key, value)
    await db.flush()
    return sub


async def dismiss_subscription(
    db: AsyncSession, subscription_id: UUID, user_id: UUID
) -> RecurringGroup | None:
    """Dismiss (cancel) a subscription."""
    sub = await get_subscription_by_id(db, subscription_id, user_id)
    if sub is None:
        return None
    sub.status = "cancelled"
    await db.flush()
    return sub


async def get_monthly_total(db: AsyncSession, user_id: UUID) -> Decimal:
    """Calculate total monthly cost of all active subscriptions.

    Normalises non-monthly frequencies to monthly equivalent:
    - weekly: amount * 52 / 12
    - monthly: amount
    - quarterly: amount / 3
    - annual: amount / 12
    """
    query = select(RecurringGroup).where(
        RecurringGroup.user_id == user_id,
        RecurringGroup.status == "active",
    )
    result = await db.execute(query)
    subscriptions = result.scalars().all()

    total = Decimal("0")
    for sub in subscriptions:
        amount = sub.estimated_amount or Decimal("0")
        if sub.frequency == "weekly":
            total += amount * 52 / 12
        elif sub.frequency == "monthly":
            total += amount
        elif sub.frequency == "quarterly":
            total += amount / 3
        elif sub.frequency == "annual":
            total += amount / 12

    return total.quantize(Decimal("0.01"))
