"""API router aggregator."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import bonus, inventory, invitations, maintenance, plans, sales, tasks

api_router = APIRouter()
api_router.include_router(bonus.router, prefix="/bonus", tags=["bonus"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(invitations.router, prefix="/invitations", tags=["invitations"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(maintenance.router, prefix="/maintenance", tags=["maintenance"])
