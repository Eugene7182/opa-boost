"""Inventory schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class InventoryBase(BaseModel):
    store_id: uuid.UUID
    product_id: uuid.UUID
    memory_gb: int | None = Field(default=None, ge=0)
    quantity: int = Field(ge=0)


class InventoryUpsert(InventoryBase):
    pass


class InventoryRead(ORMBase, InventoryBase):
    id: uuid.UUID
    updated_at: datetime


class InventoryLastUpdate(BaseModel):
    entity_id: uuid.UUID
    updated_at: datetime | None
    status: str
