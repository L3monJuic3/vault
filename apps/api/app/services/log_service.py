import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system_log import SystemLog


async def write_log(
    db: AsyncSession,
    *,
    level: str,
    category: str,
    message: str,
    detail: dict[str, Any] | None = None,
) -> SystemLog:
    """Write a structured log entry to the database."""
    entry = SystemLog(
        id=uuid.uuid4(),
        level=level.upper(),
        category=category,
        message=message,
        detail=detail,
        created_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.commit()
    return entry


async def get_logs(
    db: AsyncSession,
    *,
    level: str | None = None,
    category: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[SystemLog]:
    """Retrieve log entries, newest first."""
    query = select(SystemLog).order_by(desc(SystemLog.created_at))

    if level:
        query = query.where(SystemLog.level == level.upper())
    if category:
        query = query.where(SystemLog.category == category)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_log_counts(db: AsyncSession) -> dict[str, int]:
    """Return count of logs by level for the summary header."""
    from sqlalchemy import func

    result = await db.execute(
        select(SystemLog.level, func.count(SystemLog.id)).group_by(SystemLog.level)
    )
    return {row[0]: row[1] for row in result.all()}
