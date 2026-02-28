import enum

from sqlalchemy import Column, Date, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base, TimestampMixin


class RecurringType(str, enum.Enum):
    subscription = "subscription"
    direct_debit = "direct_debit"
    standing_order = "standing_order"
    salary = "salary"


class Frequency(str, enum.Enum):
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    annual = "annual"


class RecurringStatus(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"
    paused = "paused"
    uncertain = "uncertain"


class RecurringGroup(Base, TimestampMixin):
    __tablename__ = "recurring_groups"

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    name = Column(String, nullable=False)
    type: Column[RecurringType] = Column(Enum(RecurringType), nullable=False)
    frequency: Column[Frequency] = Column(Enum(Frequency), nullable=False)
    estimated_amount = Column(Numeric(12, 2), nullable=False)
    status: Column[RecurringStatus] = Column(
        Enum(RecurringStatus), nullable=False, default=RecurringStatus.active
    )
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    merchant_name = Column(String, nullable=True)
    next_expected_date = Column(Date, nullable=True)
    cancel_url = Column(String, nullable=True)
    cancel_steps = Column(Text, nullable=True)
