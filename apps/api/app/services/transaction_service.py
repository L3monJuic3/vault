from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction


async def get_transactions(
    db: AsyncSession,
    user_id: UUID,
    *,
    cursor: UUID | None = None,
    limit: int = 50,
    date_from=None,
    date_to=None,
    category_id: UUID | None = None,
    account_id: UUID | None = None,
    amount_min=None,
    amount_max=None,
    search: str | None = None,
) -> tuple[list[Transaction], UUID | None, bool]:
    """Get transactions with cursor-based pagination and filters.

    Returns (items, next_cursor, has_more).
    """
    from app.models.account import Account

    # Base query: join accounts to filter by user
    query = (
        select(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(Account.user_id == user_id)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
    )

    # Cursor pagination
    if cursor is not None:
        cursor_txn = await db.get(Transaction, cursor)
        if cursor_txn:
            query = query.where(
                (Transaction.date < cursor_txn.date)
                | (
                    (Transaction.date == cursor_txn.date)
                    & (Transaction.id < cursor_txn.id)
                )
            )

    # Filters
    if date_from is not None:
        query = query.where(Transaction.date >= date_from)
    if date_to is not None:
        query = query.where(Transaction.date <= date_to)
    if category_id is not None:
        query = query.where(Transaction.category_id == category_id)
    if account_id is not None:
        query = query.where(Transaction.account_id == account_id)
    if amount_min is not None:
        query = query.where(Transaction.amount >= amount_min)
    if amount_max is not None:
        query = query.where(Transaction.amount <= amount_max)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Transaction.description.ilike(search_term),
                Transaction.merchant_name.ilike(search_term),
            )
        )

    # Fetch limit + 1 to determine has_more
    query = query.limit(limit + 1)
    result = await db.execute(query)
    items = list(result.scalars().all())

    has_more = len(items) > limit
    if has_more:
        items = items[:limit]

    next_cursor = items[-1].id if has_more and items else None

    return items, next_cursor, has_more


async def get_transaction_by_id(
    db: AsyncSession, transaction_id: UUID, user_id: UUID
) -> Transaction | None:
    """Get a single transaction by ID, scoped to user."""
    from app.models.account import Account

    query = (
        select(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(Transaction.id == transaction_id, Account.user_id == user_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def update_transaction(
    db: AsyncSession, transaction_id: UUID, user_id: UUID, **kwargs
) -> Transaction | None:
    """Update a transaction's fields."""
    txn = await get_transaction_by_id(db, transaction_id, user_id)
    if txn is None:
        return None
    for key, value in kwargs.items():
        if value is not None:
            setattr(txn, key, value)
    await db.flush()
    return txn


async def bulk_update_category(
    db: AsyncSession, transaction_ids: list[UUID], category_id: UUID, user_id: UUID
) -> int:
    """Bulk update category for multiple transactions. Returns count updated."""
    count = 0
    for txn_id in transaction_ids:
        txn = await get_transaction_by_id(db, txn_id, user_id)
        if txn is not None:
            txn.category_id = category_id
            count += 1
    await db.flush()
    return count
