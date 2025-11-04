"""Plans API routes."""
from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.plans import PlanCreate, PlanProgress, PlanRead
from app.services import plans as plan_service

router = APIRouter()


@router.get("", response_model=list[PlanRead])
async def get_plans(
    promoter_id: uuid.UUID | None = Query(default=None),
    network_id: uuid.UUID | None = Query(default=None),
    month: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    plans = plan_service.list_plans(db, promoter_id=str(promoter_id) if promoter_id else None, network_id=str(network_id) if network_id else None, month=month)
    return [PlanRead.model_validate(plan) for plan in plans]


@router.post("", response_model=PlanRead, dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE, UserRole.SUPERVISOR))])
async def set_plan(payload: PlanCreate, db: Session = Depends(get_db)):
    plan = plan_service.upsert_plan(db, payload)
    return PlanRead.model_validate(plan)


@router.get("/progress", response_model=PlanProgress)
async def plan_progress(
    promoter_id: uuid.UUID,
    network_id: uuid.UUID,
    month: date,
    db: Session = Depends(get_db),
):
    return plan_service.get_progress(db, promoter_id=str(promoter_id), network_id=str(network_id), month_start=month)
