"""Inventory services."""
from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.geo import Region, Store
from app.models.inventory import Inventory
from app.schemas.inventory import InventoryLastUpdate, InventoryUpsert


def upsert_inventory(db: Session, payload: InventoryUpsert) -> Inventory:
    """Upsert inventory by store/product/memory."""

    stmt = select(Inventory).where(
        Inventory.store_id == payload.store_id,
        Inventory.product_id == payload.product_id,
        Inventory.memory_gb.is_(payload.memory_gb) if payload.memory_gb is None else Inventory.memory_gb == payload.memory_gb,
    )
    inventory = db.execute(stmt).scalar_one_or_none()
    if inventory:
        inventory.quantity = payload.quantity
        inventory.updated_at = datetime.utcnow()
    else:
        inventory = Inventory(**payload.model_dump())
        db.add(inventory)
    db.commit()
    db.refresh(inventory)
    return inventory


def list_inventory(db: Session, *, store_id: str | None = None) -> list[Inventory]:
    """List inventories filtered by store."""

    stmt = select(Inventory)
    if store_id:
        stmt = stmt.where(Inventory.store_id == store_id)
    return db.execute(stmt).scalars().all()


def inventory_last_updates(db: Session, *, scope: str) -> list[InventoryLastUpdate]:
    """Return last update status based on scope."""

    now = datetime.utcnow()
    yellow_threshold = now - timedelta(days=7)
    red_threshold = now - timedelta(days=9)

    if scope == "region":
        stmt = (
            select(Region.id, func.max(Inventory.updated_at))
            .select_from(Inventory)
            .join(Store, Store.id == Inventory.store_id)
            .join(Region, Region.id == Store.region_id)
            .group_by(Region.id)
        )
    else:
        stmt = (
            select(Inventory.store_id, func.max(Inventory.updated_at))
            .select_from(Inventory)
            .group_by(Inventory.store_id)
        )

    rows = db.execute(stmt).all()
    results: list[InventoryLastUpdate] = []
    for identifier, updated_at in rows:
        status = "green"
        if not updated_at:
            status = "red"
        elif updated_at < red_threshold:
            status = "red"
        elif updated_at < yellow_threshold:
            status = "yellow"
        results.append(InventoryLastUpdate(entity_id=identifier, updated_at=updated_at, status=status))
    return results
