from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.recurring_group import RecurringGroupRead, RecurringGroupUpdate
from app.services.subscription_service import (
    dismiss_subscription,
    get_monthly_total,
    get_subscriptions,
    update_subscription,
)

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])


@router.get("")
async def list_subscriptions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    subs = await get_subscriptions(db, user.id)
    monthly_total = await get_monthly_total(db, user.id)
    return {
        "items": [RecurringGroupRead.model_validate(s) for s in subs],
        "monthly_total": float(monthly_total),
    }


@router.patch("/{subscription_id}", response_model=RecurringGroupRead)
async def update_sub(
    subscription_id: UUID,
    update_data: RecurringGroupUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sub = await update_subscription(
        db,
        subscription_id,
        user.id,
        **update_data.model_dump(exclude_none=True),
    )
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return RecurringGroupRead.model_validate(sub)


@router.post("/{subscription_id}/dismiss", response_model=RecurringGroupRead)
async def dismiss_sub(
    subscription_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sub = await dismiss_subscription(db, subscription_id, user.id)
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return RecurringGroupRead.model_validate(sub)
