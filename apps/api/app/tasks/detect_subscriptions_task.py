import asyncio
import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def detect_subscriptions_task(self, user_id: str):
    """Celery task to detect recurring subscriptions from transaction history."""
    asyncio.run(_run_detection(user_id))


async def _run_detection(user_id: str):
    from uuid import UUID

    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import (
        AsyncSession,
        async_sessionmaker,
        create_async_engine,
    )

    from app.ai.subscription_detector import detect_subscriptions
    from app.config import settings
    from app.models.account import Account
    from app.models.transaction import Transaction

    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with session_factory() as db:
        uid = UUID(user_id)

        # Get all transactions for the user
        result = await db.execute(
            select(Transaction)
            .join(Account, Transaction.account_id == Account.id)
            .where(Account.user_id == uid)
            .order_by(Transaction.date.desc())
        )
        transactions = list(result.scalars().all())

        groups = await detect_subscriptions(db, uid, transactions)
        await db.commit()

    await engine.dispose()
    logger.info(
        f"Subscription detection complete: {len(groups)} groups found for user {user_id}"
    )
