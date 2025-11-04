"""Task and message schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.schemas.common import ORMBase


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    roles: list[str]
    network_id: uuid.UUID | None = None
    region_id: uuid.UUID | None = None
    store_id: uuid.UUID | None = None


class TaskRead(ORMBase):
    id: uuid.UUID
    title: str
    description: str | None
    roles: list[str]
    network_id: uuid.UUID | None
    region_id: uuid.UUID | None
    store_id: uuid.UUID | None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def parse_roles(cls, data):  # type: ignore[override]
        if isinstance(data, dict) and isinstance(data.get("roles"), str):
            data = {**data, "roles": [role for role in data["roles"].split(",") if role]}
        if isinstance(data, dict) and isinstance(data.get("audience_roles"), str):
            roles = [role for role in data["audience_roles"].split(",") if role]
            data = {**data, "roles": roles}
        return data


class MessageCreate(BaseModel):
    content: str
    roles: list[str]
    network_id: uuid.UUID | None = None
    region_id: uuid.UUID | None = None
    store_id: uuid.UUID | None = None


class MessageRead(ORMBase):
    id: uuid.UUID
    content: str
    roles: list[str]
    network_id: uuid.UUID | None
    region_id: uuid.UUID | None
    store_id: uuid.UUID | None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def parse_roles(cls, data):  # type: ignore[override]
        if isinstance(data, dict) and isinstance(data.get("roles"), str):
            data = {**data, "roles": [role for role in data["roles"].split(",") if role]}
        return data
