import enum
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DECIMAL

from app.models.base import Base, TimestampMixin


class AccountType(str, enum.Enum):
    current = "current"
    savings = "savings"
    credit_card = "credit_card"
    investment = "investment"
    loan = "loan"
    mortgage = "mortgage"
    pension = "pension"


class Account(Base, TimestampMixin):
    __tablename__ = "accounts"
    __table_args__ = (
        CheckConstraint(
            "type IN ('current', 'savings', 'credit_card', 'investment', 'loan', 'mortgage', 'pension')",
            name="ck_accounts_type_valid",
        ),
    )

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    name = Column(String, nullable=False)
    type = Column(String(16), nullable=False)
    provider = Column(String, nullable=False)
    currency = Column(String(3), nullable=False, default="GBP")
    current_balance: Mapped[Decimal] = mapped_column(
        DECIMAL(12, 2), nullable=False, default=0
    )
    is_active = Column(Boolean, nullable=False, default=True)
