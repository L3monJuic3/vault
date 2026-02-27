from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ImportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    account_id: UUID
    filename: str
    file_type: str
    row_count: int
    duplicates_skipped: int
    date_range_start: date | None
    date_range_end: date | None
    status: str
    error_message: str | None
    created_at: datetime
