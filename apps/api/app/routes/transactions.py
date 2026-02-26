from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.transaction import CursorPage, TransactionRead, TransactionUpdate
from app.services.transaction_service import (
    bulk_update_category,
    get_transaction_by_id,
    get_transactions,
    update_transaction,
)

router = APIRouter(prefix="/api/v1/transactions", tags=["transactions"])


class BulkCategoryRequest(BaseModel):
    transaction_ids: list[UUID]
    category_id: UUID


@router.get("", response_model=CursorPage)
async def list_transactions(
    cursor: UUID | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    category_id: UUID | None = Query(None),
    account_id: UUID | None = Query(None),
    amount_min: Decimal | None = Query(None),
    amount_max: Decimal | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items, next_cursor, has_more = await get_transactions(
        db,
        user.id,
        cursor=cursor,
        limit=limit,
        date_from=date_from,
        date_to=date_to,
        category_id=category_id,
        account_id=account_id,
        amount_min=amount_min,
        amount_max=amount_max,
        search=search,
    )
    return CursorPage(
        items=[TransactionRead.model_validate(t) for t in items],
        next_cursor=next_cursor,
        has_more=has_more,
    )


@router.get("/{transaction_id}", response_model=TransactionRead)
async def get_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    txn = await get_transaction_by_id(db, transaction_id, user.id)
    if txn is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionRead.model_validate(txn)


@router.patch("/{transaction_id}", response_model=TransactionRead)
async def patch_transaction(
    transaction_id: UUID,
    update_data: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    txn = await update_transaction(
        db,
        transaction_id,
        user.id,
        **update_data.model_dump(exclude_none=True),
    )
    if txn is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionRead.model_validate(txn)


@router.post("/bulk", status_code=status.HTTP_200_OK)
async def bulk_assign_category(
    body: BulkCategoryRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    count = await bulk_update_category(
        db, body.transaction_ids, body.category_id, user.id
    )
    return {"updated": count}
