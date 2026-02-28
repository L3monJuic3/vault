import enum

from sqlalchemy import CheckConstraint, Column, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import validates

from app.models.base import Base, TimestampMixin


class RecurringType(str, enum.Enum):
    subscription = "subscription"
    direct_debit = "direct_debit"
    standing_order = "standing_order"
    salary = "salary"


class Frequency(str, enum.Enum):
    weekly = "weekly"
    fortnightly = "fortnightly"
    monthly = "monthly"
    quarterly = "quarterly"
    annual = "annual"
    yearly = "yearly"


class RecurringStatus(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"
    paused = "paused"
    uncertain = "uncertain"


class RecurringGroup(Base, TimestampMixin):
    __tablename__ = "recurring_groups"
    __table_args__ = (
        CheckConstraint(
            "type IN ('subscription', 'direct_debit', 'standing_order', 'salary')",
            name="ck_recurring_groups_type_valid",
        ),
        CheckConstraint(
            "frequency IN ('weekly', 'fortnightly', 'monthly', 'quarterly', 'annual', 'yearly')",
            name="ck_recurring_groups_frequency_valid",
        ),
        CheckConstraint(
            "status IN ('active', 'cancelled', 'paused', 'uncertain')",
            name="ck_recurring_groups_status_valid",
        ),
    )

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    name = Column(String, nullable=False)
    type = Column(String(16), nullable=False)
    frequency = Column(String(16), nullable=False)
    estimated_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(16), nullable=False, default="active")
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    merchant_name = Column(String, nullable=True)
    next_expected_date = Column(Date, nullable=True)
    cancel_url = Column(String, nullable=True)
    cancel_steps = Column(Text, nullable=True)

    @validates("type")
    def validate_type(self, key: str, value: str) -> str:
        valid = [e.value for e in RecurringType]
        if value not in valid:
            raise ValueError(f"Invalid recurring group type: {value!r}")
        return value

    @validates("frequency")
    def validate_frequency(self, key: str, value: str) -> str:
        valid = [e.value for e in Frequency]
        if value not in valid:
            raise ValueError(f"Invalid recurring group frequency: {value!r}")
        return value

    @validates("status")
    def validate_status(self, key: str, value: str) -> str:
        valid = [e.value for e in RecurringStatus]
        if value not in valid:
            raise ValueError(f"Invalid recurring group status: {value!r}")
        return value
