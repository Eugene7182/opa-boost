"""Bonus schemas."""
from __future__ import annotations

import uuid
from datetime import date

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class BonusNetworkBase(BaseModel):
    network_id: uuid.UUID
    product_id: uuid.UUID
    memory_gb: int | None = Field(default=None, ge=0)
    base_bonus: float = Field(ge=0)
    is_active: bool = True
    valid_from: date
    valid_to: date | None = None


class BonusNetworkCreate(BonusNetworkBase):
    pass


class BonusNetworkUpdate(BaseModel):
    base_bonus: float | None = Field(default=None, ge=0)
    is_active: bool | None = None
    valid_from: date | None = None
    valid_to: date | None = None


class BonusNetworkRead(ORMBase, BonusNetworkBase):
    id: uuid.UUID


class BonusTierBase(BaseModel):
    network_id: uuid.UUID
    min_percent: float = Field(ge=0)
    max_percent: float | None = Field(default=None, ge=0)
    bonus_amount: float = Field(ge=0)


class BonusTierCreate(BonusTierBase):
    pass


class BonusTierUpdate(BaseModel):
    min_percent: float | None = Field(default=None, ge=0)
    max_percent: float | None = Field(default=None, ge=0)
    bonus_amount: float | None = Field(default=None, ge=0)


class BonusTierRead(ORMBase, BonusTierBase):
    id: uuid.UUID


class BonusImportItem(BaseModel):
    network_code: str
    product_identifier: str
    memory_gb: int | None = None
    base_bonus: float
    plan_min: float | None = None
    plan_max: float | None = None
    over_bonus: float | None = None


class BonusImportPreview(ORMBase):
    id: uuid.UUID
    description: str


class BonusCalculationResult(BaseModel):
    base_bonus: float
    over_bonus: float
    total_bonus: float


class BonusQueryParams(BaseModel):
    network_id: uuid.UUID
    product_id: uuid.UUID
    memory_gb: int | None = None
    date: date
