import logging
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recurring_group import RecurringGroup
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)


def _detect_frequency(dates: list[date]) -> str | None:
    """Detect the frequency of a recurring transaction from a list of dates."""
    if len(dates) < 2:
        return None

    sorted_dates = sorted(dates)
    gaps = [
        (sorted_dates[i + 1] - sorted_dates[i]).days
        for i in range(len(sorted_dates) - 1)
    ]
    avg_gap = sum(gaps) / len(gaps)

    if 5 <= avg_gap <= 9:
        return "weekly"
    elif 25 <= avg_gap <= 35:
        return "monthly"
    elif 80 <= avg_gap <= 100:
        return "quarterly"
    elif 350 <= avg_gap <= 380:
        return "annual"
    return None


def _predict_next_date(dates: list[date], frequency: str) -> date:
    """Predict next expected date based on frequency."""
    last_date = max(dates)
    if frequency == "weekly":
        return last_date + timedelta(days=7)
    elif frequency == "monthly":
        return last_date + timedelta(days=30)
    elif frequency == "quarterly":
        return last_date + timedelta(days=91)
    elif frequency == "annual":
        return last_date + timedelta(days=365)
    return last_date + timedelta(days=30)


async def detect_subscriptions(
    db: AsyncSession,
    user_id: UUID,
    transactions: list[Transaction],
) -> list[RecurringGroup]:
    """Analyse transactions and create RecurringGroup records for detected subscriptions.

    Groups transactions by normalised merchant name + similar amount,
    detects frequency, and creates RecurringGroup records.
    """
    # Group by merchant name (normalised)
    merchant_groups: dict[str, list[Transaction]] = defaultdict(list)
    for txn in transactions:
        key = (txn.merchant_name or txn.description).lower().strip()
        merchant_groups[key].append(txn)

    # Filter to groups with 3+ transactions (need at least 3 to detect pattern)
    recurring_candidates = {
        merchant: txns for merchant, txns in merchant_groups.items() if len(txns) >= 3
    }

    created_groups: list[RecurringGroup] = []

    for merchant_key, txns in recurring_candidates.items():
        # Check amounts are similar (within 10% or 1.00)
        amounts = [abs(txn.amount) for txn in txns]
        avg_amount = sum(amounts) / len(amounts)

        if avg_amount == 0:
            continue

        amount_consistent = all(
            abs(a - avg_amount) <= max(avg_amount * Decimal("0.1"), Decimal("1.00"))
            for a in amounts
        )

        if not amount_consistent:
            continue

        # Detect frequency
        dates = [
            txn.date.date()
            if hasattr(txn.date, "date") and callable(txn.date.date)
            else txn.date
            for txn in txns
        ]
        frequency = _detect_frequency(dates)

        if frequency is None:
            continue

        # Check if RecurringGroup already exists for this merchant
        merchant_name = txns[0].merchant_name or txns[0].description
        existing = await db.execute(
            select(RecurringGroup).where(
                RecurringGroup.user_id == user_id,
                RecurringGroup.merchant_name == merchant_name,
            )
        )
        if existing.scalar_one_or_none() is not None:
            continue

        # Determine type
        rec_type = "subscription"
        if any(word in merchant_key for word in ["salary", "wages", "pay"]):
            rec_type = "salary"
        elif any(
            word in merchant_key for word in ["council", "water", "electric", "gas"]
        ):
            rec_type = "direct_debit"

        # Create RecurringGroup
        next_date = _predict_next_date(dates, frequency)
        group = RecurringGroup(
            user_id=user_id,
            name=merchant_name,
            type=rec_type,
            frequency=frequency,
            estimated_amount=avg_amount,
            status="active",
            merchant_name=merchant_name,
            next_expected_date=next_date,
        )
        db.add(group)
        created_groups.append(group)

        # Mark transactions as recurring
        for txn in txns:
            txn.is_recurring = True  # type: ignore[assignment]
            txn.recurring_group_id = group.id

    await db.flush()
    logger.info(f"Detected {len(created_groups)} subscriptions for user {user_id}")
    return created_groups
