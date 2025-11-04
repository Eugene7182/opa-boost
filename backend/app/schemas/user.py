"""User schemas."""
from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None
    role: UserRole

    model_config = ConfigDict(from_attributes=True)
