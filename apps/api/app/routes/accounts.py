from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.account import AccountCreate, AccountRead, AccountUpdate
from app.services.account_service import (
    archive_account,
    create_account,
    get_accounts,
    update_account,
)

router = APIRouter(prefix="/api/v1/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountRead])
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all accounts for the current user."""
    accounts = await get_accounts(db, user.id)  # type: ignore[arg-type]
    return [AccountRead.model_validate(a) for a in accounts]


@router.post("", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
async def create_new_account(
    body: AccountCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new account."""
    account = await create_account(
        db,
        user.id,  # type: ignore[arg-type]
        name=body.name,
        type=body.type,
        provider=body.provider,
        currency=body.currency,
        current_balance=body.current_balance,
    )
    await db.commit()
    return AccountRead.model_validate(account)


@router.patch("/{account_id}", response_model=AccountRead)
async def update_existing_account(
    account_id: UUID,
    body: AccountUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update an account."""
    account = await update_account(
        db,
        account_id,
        user.id,  # type: ignore[arg-type]
        **body.model_dump(exclude_unset=True),
    )
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    await db.commit()
    return AccountRead.model_validate(account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_existing_account(
    account_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Archive an account (soft delete — sets is_active=False)."""
    account = await archive_account(db, account_id, user.id)  # type: ignore[arg-type]
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    await db.commit()
