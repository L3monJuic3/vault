"""insights table

Revision ID: 007
Revises: 006
Create Date: 2026-02-27

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "insights",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("data", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column(
            "is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_insights_user_id", "insights", ["user_id"])
    op.create_index(
        "ix_insights_user_id_created_at",
        "insights",
        ["user_id", sa.text("created_at DESC")],
    )
    op.create_index("ix_insights_user_id_is_read", "insights", ["user_id", "is_read"])


def downgrade() -> None:
    op.drop_index("ix_insights_user_id_is_read", "insights")
    op.drop_index("ix_insights_user_id_created_at", "insights")
    op.drop_index("ix_insights_user_id", "insights")
    op.drop_table("insights")
