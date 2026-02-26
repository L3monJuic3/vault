from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CategoryCreate(BaseModel):
    name: str
    icon: str | None = None
    colour: str | None = None
    parent_id: UUID | None = None
    budget_monthly: Decimal | None = None


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None = None
    name: str
    icon: str | None = None
    colour: str | None = None
    parent_id: UUID | None = None
    budget_monthly: float | None = None
    created_at: datetime


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    colour: str | None = None
    parent_id: UUID | None = None
    budget_monthly: Decimal | None = None
