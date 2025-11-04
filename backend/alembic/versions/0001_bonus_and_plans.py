"""Initial bonus and plans schema."""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_bonus_and_plans"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
    op.execute("CREATE SCHEMA IF NOT EXISTS auth;")
    op.execute("CREATE SCHEMA IF NOT EXISTS public;")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("full_name", sa.String()),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        schema="auth",
    )

    op.create_table(
        "profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("middle_name", sa.String()),
        sa.Column("city", sa.String()),
        sa.Column("phone", sa.String()),
        sa.Column("locale", sa.String(), server_default="ru"),
        sa.Column("theme", sa.String(), server_default="light"),
        schema="public",
    )

    op.create_table(
        "networks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(), nullable=False, unique=True),
        sa.Column("name", sa.String(), nullable=False),
        schema="public",
    )

    op.create_table(
        "regions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        schema="public",
    )

    op.create_table(
        "stores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("network_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.networks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("region_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.regions.id", ondelete="CASCADE"), nullable=False),
        schema="public",
    )

    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("sku", sa.String(), nullable=False, unique=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("price", sa.Numeric()),
        schema="public",
    )

    op.create_table(
        "inventories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.stores.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("memory_gb", sa.Integer()),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        schema="public",
    )
    op.create_index("idx_inventories_memory", "inventories", ["memory_gb"], unique=False, schema="public")

    op.create_table(
        "bonus_networks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("network_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.networks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("memory_gb", sa.Integer()),
        sa.Column("base_bonus", sa.Numeric(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("valid_from", sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column("valid_to", sa.Date()),
        sa.CheckConstraint("base_bonus >= 0", name="ck_bonus_networks_base_bonus_positive"),
        schema="public",
    )

    op.create_table(
        "bonus_overachievement_tiers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("network_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.networks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("min_percent", sa.Numeric(), nullable=False),
        sa.Column("max_percent", sa.Numeric()),
        sa.Column("bonus_amount", sa.Numeric(), nullable=False),
        sa.CheckConstraint("bonus_amount >= 0", name="ck_bonus_tiers_amount_positive"),
        schema="public",
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_bonus_tier_net_range ON public.bonus_overachievement_tiers (network_id, min_percent, COALESCE(max_percent, -1))"
    )

    op.create_table(
        "promoter_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("promoter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("network_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.networks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("month_start", sa.Date(), nullable=False),
        sa.Column("target_qty", sa.Integer(), nullable=False),
        sa.UniqueConstraint("promoter_id", "network_id", "month_start", name="uq_promoter_plan_unique"),
        schema="public",
    )

    op.create_table(
        "user_invitations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("role", sa.Text(), nullable=False),
        sa.Column("network_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.networks.id")),
        sa.Column("region_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.regions.id")),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.stores.id")),
        sa.Column("invited_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("auth.users.id", ondelete="SET NULL")),
        sa.Column("token", sa.Text(), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("role in ('admin','office','supervisor','trainer','promoter')", name="ck_user_invitations_role"),
        schema="public",
    )
    op.create_index("idx_user_invitations_email", "user_invitations", ["email"], schema="public")

    op.create_table(
        "sales",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("promoter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.stores.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("memory_gb", sa.Integer(), nullable=False),
        sa.Column("sale_date", sa.Date(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("bonus_amount", sa.Numeric(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        schema="public",
    )

    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("audience_roles", sa.String(), nullable=False),
        sa.Column("network_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.networks.id")),
        sa.Column("region_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.regions.id")),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.stores.id")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("auth.users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        schema="public",
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("roles", sa.String(), nullable=False),
        sa.Column("network_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.networks.id")),
        sa.Column("region_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.regions.id")),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("public.stores.id")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("auth.users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        schema="public",
    )



def downgrade() -> None:
    op.drop_table("chat_messages", schema="public")
    op.drop_table("tasks", schema="public")
    op.drop_table("sales", schema="public")
    op.drop_index("idx_user_invitations_email", table_name="user_invitations", schema="public")
    op.drop_table("user_invitations", schema="public")
    op.drop_table("promoter_plans", schema="public")
    op.execute("DROP INDEX IF EXISTS public.uq_bonus_tier_net_range")
    op.drop_table("bonus_overachievement_tiers", schema="public")
    op.drop_table("bonus_networks", schema="public")
    op.drop_index("idx_inventories_memory", table_name="inventories", schema="public")
    op.drop_table("inventories", schema="public")
    op.drop_table("products", schema="public")
    op.drop_table("stores", schema="public")
    op.drop_table("regions", schema="public")
    op.drop_table("networks", schema="public")
    op.drop_table("profiles", schema="public")
    op.drop_table("users", schema="auth")
*** End Patch
