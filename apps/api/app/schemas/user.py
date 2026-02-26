from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    currency: str = "GBP"


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    name: str
    currency: str
    created_at: datetime


class UserUpdate(BaseModel):
    name: str | None = None
    currency: str | None = None
