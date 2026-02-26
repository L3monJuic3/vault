"""recurring groups

Revision ID: 004
Revises: 003
Create Date: 2026-02-26

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recurring_groups",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column(
            "type",
            sa.Enum(
                "subscription",
                "direct_debit",
                "standing_order",
                "salary",
                name="recurringtype",
            ),
            nullable=False,
        ),
        sa.Column(
            "frequency",
            sa.Enum("weekly", "monthly", "quarterly", "annual", name="frequency"),
            nullable=False,
        ),
        sa.Column("estimated_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "active", "cancelled", "paused", "uncertain", name="recurringstatus"
            ),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "category_id",
            UUID(as_uuid=True),
            sa.ForeignKey("categories.id"),
            nullable=True,
        ),
        sa.Column("merchant_name", sa.String(), nullable=True),
        sa.Column("next_expected_date", sa.Date(), nullable=True),
        sa.Column("cancel_url", sa.String(), nullable=True),
        sa.Column("cancel_steps", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    # Now add FK constraint from transactions.recurring_group_id to recurring_groups.id
    op.create_foreign_key(
        "fk_transactions_recurring_group_id",
        "transactions",
        "recurring_groups",
        ["recurring_group_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_transactions_recurring_group_id", "transactions", type_="foreignkey"
    )
    op.drop_table("recurring_groups")
    op.execute("DROP TYPE IF EXISTS recurringtype")
    op.execute("DROP TYPE IF EXISTS frequency")
    op.execute("DROP TYPE IF EXISTS recurringstatus")
