from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TransactionCreate(BaseModel):
    account_id: UUID
    date: datetime
    description: str
    amount: Decimal
    balance_after: Decimal | None = None
    category_id: UUID | None = None
    subcategory: str | None = None
    merchant_name: str | None = None
    is_recurring: bool = False
    recurring_group_id: UUID | None = None
    notes: str | None = None
    tags: list[str] = []
    import_id: UUID | None = None


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    account_id: UUID
    date: datetime
    description: str
    amount: float
    balance_after: float | None = None
    category_id: UUID | None = None
    subcategory: str | None = None
    merchant_name: str | None = None
    is_recurring: bool
    recurring_group_id: UUID | None = None
    notes: str | None = None
    tags: list[str]
    ai_confidence: float | None = None
    import_id: UUID | None = None
    created_at: datetime


class TransactionUpdate(BaseModel):
    category_id: UUID | None = None
    subcategory: str | None = None
    merchant_name: str | None = None
    notes: str | None = None
    tags: list[str] | None = None
    is_recurring: bool | None = None


class TransactionFilter(BaseModel):
    date_from: datetime | None = None
    date_to: datetime | None = None
    category_id: UUID | None = None
    account_id: UUID | None = None
    amount_min: Decimal | None = None
    amount_max: Decimal | None = None
    search: str | None = None


class CursorPage(BaseModel):
    items: list[TransactionRead]
    next_cursor: UUID | None = None
    has_more: bool = False
