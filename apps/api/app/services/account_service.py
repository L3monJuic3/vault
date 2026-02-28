from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account, AccountType


async def get_accounts(db: AsyncSession, user_id: UUID) -> list[Account]:
    """Get all accounts for a user."""
    query = select(Account).where(Account.user_id == user_id).order_by(Account.name)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_account_by_id(
    db: AsyncSession, account_id: UUID, user_id: UUID
) -> Account | None:
    """Get a single account scoped to user."""
    query = select(Account).where(Account.id == account_id, Account.user_id == user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_account(
    db: AsyncSession,
    user_id: UUID,
    *,
    name: str,
    type: AccountType,
    provider: str,
    currency: str = "GBP",
    current_balance: Decimal = Decimal("0"),
) -> Account:
    """Create a new account."""
    account = Account(
        user_id=user_id,
        name=name,
        type=type,
        provider=provider,
        currency=currency,
        current_balance=current_balance,
    )
    db.add(account)
    await db.flush()
    return account


async def update_account(
    db: AsyncSession, account_id: UUID, user_id: UUID, **kwargs
) -> Account | None:
    """Update an account."""
    account = await get_account_by_id(db, account_id, user_id)
    if account is None:
        return None
    for key, value in kwargs.items():
        if value is not None:
            setattr(account, key, value)
    await db.flush()
    return account


async def archive_account(
    db: AsyncSession, account_id: UUID, user_id: UUID
) -> Account | None:
    """Archive (soft-delete) an account by setting is_active=False."""
    account = await get_account_by_id(db, account_id, user_id)
    if account is None:
        return None
    account.is_active = False  # type: ignore[assignment]
    await db.flush()
    return account
