"""Maintenance endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.jobs.scheduler import inventory_reminder_job
from app.models.user import UserRole
from app.db.session import SessionLocal

router = APIRouter()


@router.post("/run-inventory-reminder-now", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE))])
async def run_inventory_reminder_now():
    inventory_reminder_job(SessionLocal)
    return {"status": "queued"}
