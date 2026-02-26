from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel

T = TypeVar("T")


class ErrorResponse(BaseModel):
    detail: str
    code: str


class PaginationParams(BaseModel):
    cursor: UUID | None = None
    limit: int = 50


class CursorPageResponse(BaseModel, Generic[T]):
    items: list[T]
    next_cursor: UUID | None = None
    has_more: bool = False
