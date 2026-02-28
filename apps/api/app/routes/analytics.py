from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.analytics_service import (
    get_category_breakdown,
    get_dashboard_stats,
    get_spend_timeline,
    get_top_merchants,
)

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/dashboard")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """KPI stats: total balance, monthly income/spending, subscription total."""
    return await get_dashboard_stats(db, user.id)  # type: ignore[arg-type]


@router.get("/categories")
async def category_breakdown(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Spending breakdown by category."""
    return await get_category_breakdown(
        db, user.id, date_from=date_from, date_to=date_to  # type: ignore[arg-type]
    )


@router.get("/timeline")
async def spend_timeline(
    granularity: str = Query("monthly", pattern="^(daily|weekly|monthly)$"),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Income and spending over time, grouped by granularity."""
    return await get_spend_timeline(
        db, user.id, granularity=granularity, date_from=date_from, date_to=date_to  # type: ignore[arg-type]
    )


@router.get("/top-merchants")
async def top_merchants(
    limit: int = Query(5, ge=1, le=20),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Top merchants by total spending."""
    return await get_top_merchants(
        db, user.id, limit=limit, date_from=date_from, date_to=date_to  # type: ignore[arg-type]
    )
