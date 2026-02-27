"""imports table

Revision ID: 006
Revises: 005
Create Date: 2026-02-27

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "imports",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("account_id", UUID(as_uuid=True), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("file_type", sa.String(8), nullable=False),
        sa.Column("row_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duplicates_skipped", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("date_range_start", sa.Date(), nullable=True),
        sa.Column("date_range_end", sa.Date(), nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="processing"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_imports_user_id", "imports", ["user_id"])
    op.create_index("ix_imports_created_at", "imports", ["created_at"])

    # Now that the imports table exists, add the FK on transactions.import_id
    op.create_foreign_key(
        "fk_transactions_import_id",
        "transactions",
        "imports",
        ["import_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_transactions_import_id", "transactions", type_="foreignkey")
    op.drop_index("ix_imports_created_at", "imports")
    op.drop_index("ix_imports_user_id", "imports")
    op.drop_table("imports")
