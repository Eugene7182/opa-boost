"""Bonus and planning models."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BonusNetwork(Base):
    """Base bonus per network/product/memory."""

    __tablename__ = "bonus_networks"
    __table_args__ = (
        CheckConstraint("base_bonus >= 0", name="ck_bonus_networks_base_bonus_positive"),
        {"schema": "public"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    network_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("public.networks.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("public.products.id", ondelete="CASCADE"), nullable=False)
    memory_gb: Mapped[int | None] = mapped_column(Integer)
    base_bonus: Mapped[float] = mapped_column(Numeric, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    valid_from: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    valid_to: Mapped[date | None] = mapped_column(Date)


class BonusOverachievementTier(Base):
    """Overachievement corridors per network."""

    __tablename__ = "bonus_overachievement_tiers"
    __table_args__ = (
        CheckConstraint("bonus_amount >= 0", name="ck_bonus_tiers_amount_positive"),
        UniqueConstraint("network_id", "min_percent", "max_percent", name="uq_bonus_tier_unique_range"),
        {"schema": "public"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    network_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("public.networks.id", ondelete="CASCADE"), nullable=False)
    min_percent: Mapped[float] = mapped_column(Numeric, nullable=False)
    max_percent: Mapped[float | None] = mapped_column(Numeric)
    bonus_amount: Mapped[float] = mapped_column(Numeric, nullable=False)


class PromoterPlan(Base):
    """Promoter plan per network/month."""

    __tablename__ = "promoter_plans"
    __table_args__ = (
        UniqueConstraint("promoter_id", "network_id", "month_start", name="uq_promoter_plan_unique"),
        {"schema": "public"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    promoter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False)
    network_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("public.networks.id", ondelete="CASCADE"), nullable=False)
    month_start: Mapped[date] = mapped_column(Date, nullable=False)
    target_qty: Mapped[int] = mapped_column(Integer, nullable=False)


class UserInvitation(Base):
    """User invitation tokens."""

    __tablename__ = "user_invitations"
    __table_args__ = (
        CheckConstraint("role IN ('admin','office','supervisor','trainer','promoter')", name="ck_user_invitations_role"),
        {"schema": "public"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    network_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("public.networks.id"))
    region_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("public.regions.id"))
    store_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("public.stores.id"))
    invited_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="SET NULL"))
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
