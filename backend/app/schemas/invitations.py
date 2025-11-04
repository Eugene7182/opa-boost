"""Invitation schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMBase


class InvitationCreate(BaseModel):
    email: EmailStr
    role: str = Field(pattern="^(admin|office|supervisor|trainer|promoter)$")
    network_id: uuid.UUID | None = None
    region_id: uuid.UUID | None = None
    store_id: uuid.UUID | None = None


class InvitationRead(ORMBase):
    id: uuid.UUID
    email: EmailStr
    role: str
    token: str
    expires_at: datetime
    accepted_at: datetime | None = None


class InvitationAccept(BaseModel):
    token: str
    full_name: str
    password: str


class RoleAssignment(BaseModel):
    user_id: uuid.UUID
    role: str
    network_id: uuid.UUID | None = None
    region_id: uuid.UUID | None = None
    store_id: uuid.UUID | None = None
