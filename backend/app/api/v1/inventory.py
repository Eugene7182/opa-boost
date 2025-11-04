"""Inventory API."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.inventory import InventoryLastUpdate, InventoryRead, InventoryUpsert
from app.services import inventory as inventory_service

router = APIRouter()


@router.get("", response_model=list[InventoryRead])
async def get_inventory(
    store_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
):
    inventories = inventory_service.list_inventory(db, store_id=str(store_id) if store_id else None)
    return [InventoryRead.model_validate(inv) for inv in inventories]


@router.post("/upsert", response_model=InventoryRead)
async def upsert_inventory(payload: InventoryUpsert, db: Session = Depends(get_db)):
    inventory = inventory_service.upsert_inventory(db, payload)
    return InventoryRead.model_validate(inventory)


@router.get("/last-updates", response_model=list[InventoryLastUpdate])
async def last_updates(scope: str = Query(default="store"), db: Session = Depends(get_db)):
    return inventory_service.inventory_last_updates(db, scope=scope)
