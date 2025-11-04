"""Bonus API routes."""
from __future__ import annotations

from datetime import date as date_type
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import UserRole
from app.models.bonus import BonusNetwork, BonusOverachievementTier
from app.schemas.bonus import BonusNetworkCreate, BonusNetworkRead, BonusNetworkUpdate, BonusTierCreate, BonusTierRead, BonusTierUpdate
from app.services import bonus as bonus_service

router = APIRouter()


@router.get("/networks", response_model=BonusNetworkRead | None)
async def read_active_bonus(
    network_id: str = Query(...),
    product_id: str = Query(...),
    memory_gb: int | None = Query(default=None),
    date: date_type = Query(...),
    db: Session = Depends(get_db),
):
    bonus = bonus_service.get_active_bonus(
        db,
        network_id=uuid.UUID(network_id),
        product_id=uuid.UUID(product_id),
        memory_gb=memory_gb,
        ref_date=date,
    )
    return BonusNetworkRead.model_validate(bonus)


@router.post("/networks", response_model=BonusNetworkRead, dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE))])
async def create_bonus(payload: BonusNetworkCreate, db: Session = Depends(get_db)):
    bonus = BonusNetwork(**payload.model_dump())
    db.add(bonus)
    db.commit()
    db.refresh(bonus)
    return BonusNetworkRead.model_validate(bonus)


@router.put("/networks/{bonus_id}", response_model=BonusNetworkRead, dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE))])
async def update_bonus(bonus_id: str, payload: BonusNetworkUpdate, db: Session = Depends(get_db)):
    bonus = db.get(BonusNetwork, uuid.UUID(bonus_id))
    if not bonus:
        raise HTTPException(status_code=404, detail="Bonus not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(bonus, field, value)
    db.commit()
    db.refresh(bonus)
    return BonusNetworkRead.model_validate(bonus) if bonus else None


@router.delete("/networks/{bonus_id}", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE))])
async def delete_bonus(bonus_id: str, db: Session = Depends(get_db)):
    bonus = db.get(BonusNetwork, uuid.UUID(bonus_id))
    if not bonus:
        raise HTTPException(status_code=404, detail="Bonus not found")
    db.delete(bonus)
    db.commit()
    return {"status": "deleted"}


@router.get("/tiers", response_model=list[BonusTierRead])
async def list_tiers(network_id: str = Query(...), db: Session = Depends(get_db)):
    stmt = (
        db.query(BonusOverachievementTier)
        .filter(BonusOverachievementTier.network_id == uuid.UUID(network_id))
        .order_by(BonusOverachievementTier.min_percent)
    )
    tiers = stmt.all()
    return [BonusTierRead.model_validate(tier) for tier in tiers]


@router.post("/tiers", response_model=BonusTierRead, dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE))])
async def create_tier(payload: BonusTierCreate, db: Session = Depends(get_db)):
    tier = BonusOverachievementTier(**payload.model_dump())
    db.add(tier)
    db.commit()
    db.refresh(tier)
    return BonusTierRead.model_validate(tier)


@router.put("/tiers/{tier_id}", response_model=BonusTierRead, dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE))])
async def update_tier(tier_id: str, payload: BonusTierUpdate, db: Session = Depends(get_db)):
    tier = db.get(BonusOverachievementTier, uuid.UUID(tier_id))
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tier, field, value)
    db.commit()
    db.refresh(tier)
    return BonusTierRead.model_validate(tier)


@router.delete("/tiers/{tier_id}", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE))])
async def delete_tier(tier_id: str, db: Session = Depends(get_db)):
    tier = db.get(BonusOverachievementTier, uuid.UUID(tier_id))
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    db.delete(tier)
    db.commit()
    return {"status": "deleted"}


@router.post("/import")
async def import_bonus(
    file: UploadFile = File(...),
    dry_run: bool = Query(default=False, alias="dryRun"),
    db: Session = Depends(get_db),
    _: str = Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE)),
):
    content = await file.read()
    items = bonus_service.parse_import_csv(content)
    result = bonus_service.apply_bonus_import(db, items=items, dry_run=dry_run)
    return result
