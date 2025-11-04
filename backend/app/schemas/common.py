"""Common schema utilities."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    """Base schema enabling ORM mode."""

    model_config = ConfigDict(from_attributes=True)


class IDSchema(ORMBase):
    """Schema carrying identifier."""

    id: uuid.UUID


class TimestampedSchema(ORMBase):
    """Schema with created timestamp."""

    created_at: datetime


class DateRangeSchema(ORMBase):
    """Schema with validity range."""

    valid_from: date
    valid_to: date | None = None
