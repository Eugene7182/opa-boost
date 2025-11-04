"""Sales service."""
from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bonus import BonusNetwork, BonusOverachievementTier, PromoterPlan
from app.models.geo import Store
from app.models.sales import Sale
from app.schemas.bonus import BonusCalculationResult
from app.schemas.sales import SaleCreate
from app.services.bonus import calculate_bonus, get_active_bonus, get_overachievement_tier
from app.services.plans import get_progress


def create_sale(db: Session, payload: SaleCreate) -> tuple[Sale, BonusCalculationResult]:
    """Create sale with calculated bonus."""

    store = db.execute(select(Store).where(Store.id == payload.store_id)).scalar_one()
    base_bonus = get_active_bonus(
        db,
        network_id=store.network_id,
        product_id=payload.product_id,
        memory_gb=payload.memory_gb,
        ref_date=payload.sale_date,
    )
    progress = get_progress(
        db,
        promoter_id=str(payload.promoter_id),
        network_id=str(store.network_id),
        month_start=payload.sale_date.replace(day=1),
    )
    tier = get_overachievement_tier(db, network_id=store.network_id, percent=progress.percent)
    calculation = calculate_bonus(base=base_bonus, tier=tier, quantity=payload.quantity)

    sale = Sale(
        promoter_id=payload.promoter_id,
        store_id=payload.store_id,
        product_id=payload.product_id,
        memory_gb=payload.memory_gb,
        sale_date=payload.sale_date,
        quantity=payload.quantity,
        bonus_amount=calculation.total_bonus,
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale, calculation
