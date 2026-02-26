import asyncio
import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def categorise_transactions_task(self, user_id: str, transaction_ids: list[str]):
    """Celery task to categorise transactions via AI."""
    asyncio.run(_run_categorisation(user_id, transaction_ids))


async def _run_categorisation(user_id: str, transaction_ids: list[str]):
    from uuid import UUID

    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import (
        AsyncSession,
        async_sessionmaker,
        create_async_engine,
    )

    from app.ai.categoriser import categorise_transactions
    from app.config import settings
    from app.models.category import Category
    from app.models.transaction import Transaction

    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with session_factory() as db:
        uid = UUID(user_id)
        txn_uuids = [UUID(tid) for tid in transaction_ids]

        result = await db.execute(
            select(Transaction).where(Transaction.id.in_(txn_uuids))
        )
        transactions = list(result.scalars().all())

        categorised = await categorise_transactions(db, transactions, uid)

        # Apply results
        categories = {}
        cat_result = await db.execute(select(Category))
        for cat in cat_result.scalars().all():
            categories[cat.name.lower()] = cat.id

        for item in categorised:
            txn = next(
                (t for t in transactions if t.id == item["transaction_id"]), None
            )
            if txn is None:
                continue
            cat_id = categories.get(item["category_name"].lower())
            if cat_id:
                txn.category_id = cat_id
                txn.ai_confidence = item["confidence"]
            if item.get("merchant_name"):
                txn.merchant_name = item["merchant_name"]

        await db.commit()

    await engine.dispose()
    logger.info(f"Categorised {len(categorised)} transactions for user {user_id}")
