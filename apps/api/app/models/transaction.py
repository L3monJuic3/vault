from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from app.models.base import Base, TimestampMixin


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    account_id = Column(
        UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False, index=True
    )
    date = Column(DateTime(timezone=True), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    balance_after = Column(Numeric(12, 2), nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    subcategory = Column(String, nullable=True)
    merchant_name = Column(String, nullable=True)
    is_recurring = Column(Boolean, nullable=False, default=False)
    recurring_group_id = Column(
        UUID(as_uuid=True), ForeignKey("recurring_groups.id"), nullable=True
    )
    notes = Column(Text, nullable=True)
    tags = Column(ARRAY(String), nullable=False, default=[])
    ai_confidence = Column(Float, nullable=True)
    import_id = Column(UUID(as_uuid=True), nullable=True)

    __table_args__ = (Index("ix_transactions_account_date", "account_id", "date"),)
