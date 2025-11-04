"""Invitation services."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bonus import UserInvitation
from app.models.user import User, UserProfile, UserRole
from app.schemas.invitations import InvitationAccept, InvitationCreate, RoleAssignment
from app.services.security import hash_password


INVITATION_TTL_HOURS = 72


def create_invitation(db: Session, payload: InvitationCreate, invited_by: str) -> UserInvitation:
    """Create invitation entry."""

    token = secrets.token_urlsafe(32)
    invitation = UserInvitation(
        email=payload.email,
        role=payload.role,
        network_id=payload.network_id,
        region_id=payload.region_id,
        store_id=payload.store_id,
        invited_by=invited_by,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=INVITATION_TTL_HOURS),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


def accept_invitation(db: Session, payload: InvitationAccept) -> User:
    """Accept invitation and create user."""

    stmt = select(UserInvitation).where(UserInvitation.token == payload.token)
    invitation = db.execute(stmt).scalar_one_or_none()
    if not invitation:
        raise ValueError("Invalid invitation token")
    if invitation.accepted_at is not None:
        raise ValueError("Invitation already accepted")
    if invitation.expires_at < datetime.utcnow():
        raise ValueError("Invitation expired")

    user = User(email=invitation.email, full_name=payload.full_name, hashed_password=hash_password(payload.password), role=UserRole(invitation.role))
    db.add(user)
    db.flush()
    profile = UserProfile(user_id=user.id, locale="ru", theme="light")
    db.add(profile)
    invitation.accepted_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def assign_role(db: Session, payload: RoleAssignment) -> User:
    """Assign role to existing user."""

    stmt = select(User).where(User.id == payload.user_id)
    user = db.execute(stmt).scalar_one()
    user.role = UserRole(payload.role)
    db.commit()
    db.refresh(user)
    return user
