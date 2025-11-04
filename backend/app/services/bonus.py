"""Bonus services for base bonuses, tiers and import."""
from __future__ import annotations

import csv
import io
import uuid
from datetime import date

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.bonus import BonusNetwork, BonusOverachievementTier
from app.models.geo import Network
from app.models.product import Product
from app.schemas.bonus import BonusCalculationResult, BonusImportItem


def get_active_bonus(
    db: Session,
    *,
    network_id: uuid.UUID,
    product_id: uuid.UUID,
    memory_gb: int | None,
    ref_date: date,
) -> BonusNetwork | None:
    """Return active base bonus prioritising exact memory match."""

    stmt = (
        select(BonusNetwork)
        .where(
            BonusNetwork.network_id == network_id,
            BonusNetwork.product_id == product_id,
            BonusNetwork.is_active.is_(True),
            BonusNetwork.valid_from <= ref_date,
            func.coalesce(BonusNetwork.valid_to, ref_date) >= ref_date,
        )
        .order_by(BonusNetwork.memory_gb.is_(None).asc())
    )
    bonuses = db.execute(stmt).scalars().all()
    exact = next((b for b in bonuses if b.memory_gb == memory_gb), None)
    if exact:
        return exact
    return next((b for b in bonuses if b.memory_gb is None), None)


def get_overachievement_tier(
    db: Session,
    *,
    network_id: uuid.UUID,
    percent: float,
) -> BonusOverachievementTier | None:
    """Return matching overachievement tier."""

    stmt = select(BonusOverachievementTier).where(
        BonusOverachievementTier.network_id == network_id,
        BonusOverachievementTier.min_percent <= percent,
        func.coalesce(BonusOverachievementTier.max_percent, percent) >= percent,
    )
    return db.execute(stmt).scalar_one_or_none()


def calculate_bonus(
    *, base: BonusNetwork | None, tier: BonusOverachievementTier | None, quantity: int
) -> BonusCalculationResult:
    """Calculate resulting bonus."""

    base_amount = float(base.base_bonus) * quantity if base else 0.0
    over_amount = float(tier.bonus_amount) if tier else 0.0
    return BonusCalculationResult(base_bonus=base_amount, over_bonus=over_amount, total_bonus=base_amount + over_amount)


def parse_import_csv(content: bytes) -> list[BonusImportItem]:
    """Parse CSV content into import items."""

    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    items: list[BonusImportItem] = []
    for row in reader:
        items.append(
            BonusImportItem(
                network_code=row["network_code"].strip(),
                product_identifier=row["product_sku_or_name"].strip(),
                memory_gb=int(row["memory_gb"].strip()) if row["memory_gb"].strip() else None,
                base_bonus=float(row["base_bonus"].strip()),
                plan_min=float(row["plan_min"].strip()) if row["plan_min"].strip() else None,
                plan_max=float(row["plan_max"].strip()) if row["plan_max"].strip() else None,
                over_bonus=float(row["over_bonus"].strip()) if row["over_bonus"].strip() else None,
            )
        )
    return items


def resolve_product(db: Session, identifier: str) -> Product | None:
    """Find product by SKU or name."""

    stmt = select(Product).where(
        func.lower(Product.sku) == identifier.lower()
    )
    product = db.execute(stmt).scalar_one_or_none()
    if product:
        return product
    stmt = select(Product).where(func.lower(Product.name) == identifier.lower())
    return db.execute(stmt).scalar_one_or_none()


def resolve_network(db: Session, code: str) -> Network:
    """Find or create network by code."""

    stmt = select(Network).where(func.lower(Network.code) == code.lower())
    network = db.execute(stmt).scalar_one_or_none()
    if network:
        return network
    network = Network(code=code.upper(), name=code.upper())
    db.add(network)
    db.flush()
    return network


def apply_bonus_import(
    db: Session,
    *,
    items: list[BonusImportItem],
    dry_run: bool = False,
) -> dict[str, list[str]]:
    """Apply import items. Returns summary of operations."""

    created: list[str] = []
    updated: list[str] = []
    for item in items:
        network = resolve_network(db, item.network_code)
        product = resolve_product(db, item.product_identifier)
        if not product:
            raise ValueError(f"Product not found: {item.product_identifier}")
        stmt = select(BonusNetwork).where(
            BonusNetwork.network_id == network.id,
            BonusNetwork.product_id == product.id,
            BonusNetwork.memory_gb.is_(item.memory_gb) if item.memory_gb is None else BonusNetwork.memory_gb == item.memory_gb,
        )
        bonus = db.execute(stmt).scalar_one_or_none()
        if bonus:
            bonus.base_bonus = item.base_bonus
            updated.append(f"bonus:{bonus.id}")
        else:
            bonus_create = BonusNetwork(
                network_id=network.id,
                product_id=product.id,
                memory_gb=item.memory_gb,
                base_bonus=item.base_bonus,
                valid_from=date.today(),
            )
            db.add(bonus_create)
            db.flush()
            created.append(f"bonus:{bonus_create.id}")
        if item.over_bonus is not None and item.plan_min is not None:
            stmt_tier = select(BonusOverachievementTier).where(
                BonusOverachievementTier.network_id == network.id,
                BonusOverachievementTier.min_percent == item.plan_min,
                func.coalesce(BonusOverachievementTier.max_percent, -1) == (item.plan_max if item.plan_max is not None else -1),
            )
            tier = db.execute(stmt_tier).scalar_one_or_none()
            if tier:
                tier.bonus_amount = item.over_bonus
                updated.append(f"tier:{tier.id}")
            else:
                tier = BonusOverachievementTier(
                    network_id=network.id,
                    min_percent=item.plan_min,
                    max_percent=item.plan_max,
                    bonus_amount=item.over_bonus,
                )
                db.add(tier)
                db.flush()
                created.append(f"tier:{tier.id}")
    if dry_run:
        db.rollback()
    else:
        db.commit()
    return {"created": created, "updated": updated}
