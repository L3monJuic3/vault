from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base, TimestampMixin


class Import(Base, TimestampMixin):
    __tablename__ = "imports"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String(8), nullable=False)
    row_count = Column(Integer, nullable=False, default=0)
    duplicates_skipped = Column(Integer, nullable=False, default=0)
    date_range_start = Column(Date, nullable=True)
    date_range_end = Column(Date, nullable=True)
    status = Column(String(16), nullable=False, default="processing")
    error_message = Column(Text, nullable=True)
