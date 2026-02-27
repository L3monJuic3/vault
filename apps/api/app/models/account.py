import enum

from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
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

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    name = Column(String, nullable=False)
    type = Column(String(16), nullable=False)
    provider = Column(String, nullable=False)
    currency = Column(String(3), nullable=False, default="GBP")
    current_balance = Column(DECIMAL(12, 2), nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
