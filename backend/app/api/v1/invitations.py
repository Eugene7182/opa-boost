"""Invitations API."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserRead
from app.schemas.invitations import InvitationAccept, InvitationCreate, InvitationRead, RoleAssignment
from app.services import invitations as invitation_service

router = APIRouter()


@router.post("", response_model=InvitationRead, dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE))])
async def invite_user(payload: InvitationCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    invitation = invitation_service.create_invitation(db, payload, invited_by=str(user.id))
    return InvitationRead.model_validate(invitation)


@router.post("/accept", response_model=UserRead)
async def accept(payload: InvitationAccept, db: Session = Depends(get_db)):
    user = invitation_service.accept_invitation(db, payload)
    return UserRead.model_validate(user)


@router.post("/assign-role", response_model=UserRead, dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.OFFICE))])
async def assign(payload: RoleAssignment, db: Session = Depends(get_db)):
    user = invitation_service.assign_role(db, payload)
    return UserRead.model_validate(user)
