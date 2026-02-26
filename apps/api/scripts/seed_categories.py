"""Seed default system categories.

Run: python -m scripts.seed_categories
Or:  cd apps/api && python scripts/seed_categories.py
"""

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.category import Category

DEFAULT_CATEGORIES = [
    {"name": "Housing", "icon": "\U0001f3e0", "colour": "#6366F1"},
    {"name": "Food & Drink", "icon": "\U0001f354", "colour": "#F59E0B"},
    {"name": "Transport", "icon": "\U0001f697", "colour": "#3B82F6"},
    {"name": "Shopping", "icon": "\U0001f6cd\ufe0f", "colour": "#EC4899"},
    {"name": "Subscriptions", "icon": "\U0001f4f1", "colour": "#8B5CF6"},
    {"name": "Entertainment", "icon": "\U0001f3ac", "colour": "#14B8A6"},
    {"name": "Health", "icon": "\U0001f48a", "colour": "#EF4444"},
    {"name": "Education", "icon": "\U0001f4da", "colour": "#06B6D4"},
    {"name": "Income", "icon": "\U0001f4b0", "colour": "#22C55E"},
    {"name": "Transfers", "icon": "\U0001f504", "colour": "#64748B"},
    {"name": "Other", "icon": "\U0001f4cb", "colour": "#94A3B8"},
]


async def seed_categories() -> None:
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with session_factory() as session:
        # Check if categories already exist
        result = await session.execute(
            select(Category).where(Category.user_id.is_(None)).limit(1)
        )
        if result.scalar_one_or_none() is not None:
            print("System categories already seeded — skipping.")
            return

        for cat_data in DEFAULT_CATEGORIES:
            category = Category(
                id=uuid.uuid4(),
                user_id=None,
                name=cat_data["name"],
                icon=cat_data["icon"],
                colour=cat_data["colour"],
                parent_id=None,
                budget_monthly=None,
                created_at=datetime.now(timezone.utc),
            )
            session.add(category)

        await session.commit()
        print(f"Seeded {len(DEFAULT_CATEGORIES)} system categories.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_categories())
