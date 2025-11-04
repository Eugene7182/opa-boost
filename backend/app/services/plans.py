"""Plan services."""
from __future__ import annotations

import calendar
from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bonus import PromoterPlan
from app.models.geo import Store
from app.models.sales import Sale
from app.schemas.plans import PlanCreate, PlanProgress


def upsert_plan(db: Session, payload: PlanCreate) -> PromoterPlan:
    """Insert or update promoter plan."""

    stmt = select(PromoterPlan).where(
        PromoterPlan.promoter_id == payload.promoter_id,
        PromoterPlan.network_id == payload.network_id,
        PromoterPlan.month_start == payload.month_start,
    )
    plan = db.execute(stmt).scalar_one_or_none()
    if plan:
        plan.target_qty = payload.target_qty
    else:
        plan = PromoterPlan(**payload.model_dump())
        db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def list_plans(db: Session, *, promoter_id: str | None, network_id: str | None, month: date | None) -> list[PromoterPlan]:
    """Return plans filtered by parameters."""

    stmt = select(PromoterPlan)
    if promoter_id:
        stmt = stmt.where(PromoterPlan.promoter_id == promoter_id)
    if network_id:
        stmt = stmt.where(PromoterPlan.network_id == network_id)
    if month:
        stmt = stmt.where(PromoterPlan.month_start == month)
    return db.execute(stmt).scalars().all()


def get_progress(
    db: Session,
    *,
    promoter_id: str,
    network_id: str,
    month_start: date,
) -> PlanProgress:
    """Calculate sales progress for a promoter in month."""

    stmt_plan = select(PromoterPlan).where(
        PromoterPlan.promoter_id == promoter_id,
        PromoterPlan.network_id == network_id,
        PromoterPlan.month_start == month_start,
    )
    plan = db.execute(stmt_plan).scalar_one_or_none()
    target_qty = plan.target_qty if plan else 0

    month_end = date(month_start.year, month_start.month, calendar.monthrange(month_start.year, month_start.month)[1])
    stmt_sales = (
        select(func.coalesce(func.sum(Sale.quantity), 0))
        .select_from(Sale)
        .join(Store, Store.id == Sale.store_id)
        .where(
            Sale.promoter_id == promoter_id,
            Sale.sale_date >= month_start,
            Sale.sale_date <= month_end,
            Store.network_id == network_id,
        )
    )
    sold_qty = int(db.execute(stmt_sales).scalar_one())

    percent = float(sold_qty / target_qty * 100) if target_qty else 0.0
    today = datetime.utcnow().date()
    days_passed = max((min(today, month_end) - month_start).days + 1, 1)
    total_days = (month_end - month_start).days + 1
    projection_qty = sold_qty / days_passed * total_days if days_passed else sold_qty

    return PlanProgress(sold_qty=sold_qty, target_qty=target_qty, percent=percent, projection_qty=projection_qty)
