"""add check constraints for account type and recurring group enums

Revision ID: 009
Revises: 008
Create Date: 2026-02-28
"""

from typing import Sequence, Union

from alembic import op

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_accounts_type_valid",
        "accounts",
        "type IN ('current', 'savings', 'credit_card', 'investment', 'loan', 'mortgage', 'pension')",
    )
    op.create_check_constraint(
        "ck_recurring_groups_type_valid",
        "recurring_groups",
        "type IN ('subscription', 'direct_debit', 'standing_order', 'salary')",
    )
    op.create_check_constraint(
        "ck_recurring_groups_frequency_valid",
        "recurring_groups",
        "frequency IN ('weekly', 'fortnightly', 'monthly', 'quarterly', 'annual', 'yearly')",
    )
    op.create_check_constraint(
        "ck_recurring_groups_status_valid",
        "recurring_groups",
        "status IN ('active', 'cancelled', 'paused', 'uncertain')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_recurring_groups_status_valid", "recurring_groups")
    op.drop_constraint("ck_recurring_groups_frequency_valid", "recurring_groups")
    op.drop_constraint("ck_recurring_groups_type_valid", "recurring_groups")
    op.drop_constraint("ck_accounts_type_valid", "accounts")
