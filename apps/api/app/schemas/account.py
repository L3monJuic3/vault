from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.account import AccountType


class AccountCreate(BaseModel):
    name: str
    type: AccountType
    provider: str
    currency: str = "GBP"
    current_balance: Decimal = Decimal("0")


class AccountRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    type: AccountType
    provider: str
    currency: str
    current_balance: float
    is_active: bool
    created_at: datetime


class AccountUpdate(BaseModel):
    name: str | None = None
    provider: str | None = None
    current_balance: Decimal | None = None
    is_active: bool | None = None
