from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.recurring_group import Frequency, RecurringStatus, RecurringType


class RecurringGroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    type: RecurringType
    frequency: Frequency
    estimated_amount: float
    status: RecurringStatus
    category_id: UUID | None = None
    merchant_name: str | None = None
    next_expected_date: date | None = None
    cancel_url: str | None = None
    cancel_steps: str | None = None
    created_at: datetime


class RecurringGroupUpdate(BaseModel):
    name: str | None = None
    status: RecurringStatus | None = None
    category_id: UUID | None = None
    estimated_amount: Decimal | None = None
    next_expected_date: date | None = None
    cancel_url: str | None = None
    cancel_steps: str | None = None
