"""Sales schemas."""
from __future__ import annotations

import uuid
from datetime import date

from pydantic import BaseModel, Field

from app.schemas.bonus import BonusCalculationResult
from app.schemas.common import ORMBase


class SaleBase(BaseModel):
    promoter_id: uuid.UUID
    store_id: uuid.UUID
    product_id: uuid.UUID
    memory_gb: int = Field(ge=0)
    sale_date: date
    quantity: int = Field(ge=1)


class SaleCreate(SaleBase):
    pass


class SaleRead(ORMBase, SaleBase):
    id: uuid.UUID
    bonus_amount: float


class SaleResponse(SaleRead):
    calculation: BonusCalculationResult | None = None
