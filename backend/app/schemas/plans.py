"""Plan schemas."""
from __future__ import annotations

import uuid
from datetime import date

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class PlanBase(BaseModel):
    promoter_id: uuid.UUID
    network_id: uuid.UUID
    month_start: date
    target_qty: int = Field(ge=0)


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    target_qty: int = Field(ge=0)


class PlanRead(ORMBase, PlanBase):
    id: uuid.UUID


class PlanProgress(BaseModel):
    sold_qty: int
    target_qty: int
    percent: float
    projection_qty: float
