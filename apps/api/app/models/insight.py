from sqlalchemy import Boolean, Column, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models.base import Base, TimestampMixin


class Insight(Base, TimestampMixin):
    """AI-generated financial insight linked to a user."""

    __tablename__ = "insights"

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    type = Column(
        String, nullable=False
    )  # e.g. "spending_spike", "savings_opportunity"
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    data = Column(JSONB, nullable=True)  # supporting figures
    is_read = Column(Boolean, nullable=False, server_default="false")

    __table_args__ = (
        Index(
            "ix_insights_user_id_created_at",
            "user_id",
            "created_at",
            postgresql_using="btree",
        ),
        Index("ix_insights_user_id_is_read", "user_id", "is_read"),
    )
