from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import Base, TimestampMixin


class SystemLog(Base, TimestampMixin):
    """Structured log entries stored in the database for in-app debugging."""

    __tablename__ = "system_logs"

    level = Column(
        String(16), nullable=False, index=True
    )  # DEBUG INFO WARNING ERROR CRITICAL
    category = Column(
        String(32), nullable=False, index=True
    )  # http parse ai auth system task
    message = Column(Text, nullable=False)
    detail = Column(
        JSONB, nullable=True
    )  # extra context — request path, traceback, etc.
