"""convert enum columns to varchar

Revision ID: 008
Revises: 007
Create Date: 2026-02-27

PostgreSQL ENUM types (accounttype, recurringtype, frequency,
recurringstatus) cause asyncpg UndefinedFunctionError when compared
against string parameters. This migration converts all four columns
to VARCHAR and drops the orphaned ENUM types.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── accounts.type: accounttype → varchar(16) ──
    op.execute(
        "ALTER TABLE accounts ALTER COLUMN type TYPE VARCHAR(16) USING type::text"
    )

    # ── recurring_groups.type: recurringtype → varchar(16) ──
    op.execute(
        "ALTER TABLE recurring_groups "
        "ALTER COLUMN type TYPE VARCHAR(16) USING type::text"
    )

    # ── recurring_groups.frequency: frequency → varchar(16) ──
    op.execute(
        "ALTER TABLE recurring_groups "
        "ALTER COLUMN frequency TYPE VARCHAR(16) USING frequency::text"
    )

    # ── recurring_groups.status: recurringstatus → varchar(16) ──
    # Must drop the server default first — it references the enum type
    # ('active'::recurringstatus), which blocks DROP TYPE.
    op.execute("ALTER TABLE recurring_groups ALTER COLUMN status DROP DEFAULT")
    op.execute(
        "ALTER TABLE recurring_groups "
        "ALTER COLUMN status TYPE VARCHAR(16) USING status::text"
    )
    op.execute("ALTER TABLE recurring_groups ALTER COLUMN status SET DEFAULT 'active'")

    # ── Drop orphaned ENUM types ──
    op.execute("DROP TYPE IF EXISTS accounttype")
    op.execute("DROP TYPE IF EXISTS recurringtype")
    op.execute("DROP TYPE IF EXISTS frequency")
    op.execute("DROP TYPE IF EXISTS recurringstatus")


def downgrade() -> None:
    # Re-create ENUM types
    op.execute(
        "CREATE TYPE accounttype AS ENUM "
        "('current','savings','credit_card','investment','loan','mortgage','pension')"
    )
    op.execute(
        "CREATE TYPE recurringtype AS ENUM "
        "('subscription','direct_debit','standing_order','salary')"
    )
    op.execute(
        "CREATE TYPE frequency AS ENUM ('weekly','monthly','quarterly','annual')"
    )
    op.execute(
        "CREATE TYPE recurringstatus AS ENUM "
        "('active','cancelled','paused','uncertain')"
    )

    # Convert back
    op.execute(
        "ALTER TABLE accounts "
        "ALTER COLUMN type TYPE accounttype USING type::accounttype"
    )
    op.execute(
        "ALTER TABLE recurring_groups "
        "ALTER COLUMN type TYPE recurringtype USING type::recurringtype"
    )
    op.execute(
        "ALTER TABLE recurring_groups "
        "ALTER COLUMN frequency TYPE frequency USING frequency::frequency"
    )
    op.execute(
        "ALTER TABLE recurring_groups "
        "ALTER COLUMN status TYPE recurringstatus USING status::recurringstatus"
    )
