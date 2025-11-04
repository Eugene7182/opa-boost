"""Regional and store models."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Network(Base):
    """Retail network entity."""

    __tablename__ = "networks"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)

    stores: Mapped[list["Store"]] = relationship(back_populates="network")


class Region(Base):
    """Geographical region."""

    __tablename__ = "regions"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    stores: Mapped[list["Store"]] = relationship(back_populates="region")


class Store(Base):
    """Store entity bound to network and region."""

    __tablename__ = "stores"
    __table_args__ = {"schema": "public"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    network_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("public.networks.id", ondelete="CASCADE"))
    region_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("public.regions.id", ondelete="CASCADE"))

    network: Mapped[Network] = relationship(back_populates="stores")
    region: Mapped[Region] = relationship(back_populates="stores")
