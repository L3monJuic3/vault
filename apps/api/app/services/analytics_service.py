from datetime import date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.category import Category
from app.models.recurring_group import RecurringGroup
from app.models.transaction import Transaction


async def get_dashboard_stats(db: AsyncSession, user_id: UUID) -> dict:
    """Return KPI stats for the dashboard: balance, income, spending, subscriptions."""

    # Total balance: sum of all active accounts
    balance_query = select(func.sum(Account.current_balance)).where(
        Account.user_id == user_id,
        Account.is_active.is_(True),
    )
    balance_result = await db.execute(balance_query)
    total_balance = balance_result.scalar() or Decimal("0")

    # Monthly income + spending: current calendar month
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)

    monthly_query = (
        select(Transaction.amount)
        .join(Account, Transaction.account_id == Account.id)
        .where(
            Account.user_id == user_id,
            Transaction.date >= month_start,
        )
    )
    monthly_result = await db.execute(monthly_query)
    amounts = [row[0] for row in monthly_result.all()]

    monthly_income = sum(a for a in amounts if a > 0)
    monthly_spending = abs(sum(a for a in amounts if a < 0))

    # Transaction count this month
    count_query = (
        select(func.count(Transaction.id))
        .join(Account, Transaction.account_id == Account.id)
        .where(
            Account.user_id == user_id,
            Transaction.date >= month_start,
        )
    )
    count_result = await db.execute(count_query)
    transaction_count = count_result.scalar() or 0

    # Active subscription monthly total
    sub_query = select(RecurringGroup).where(
        RecurringGroup.user_id == user_id,
        RecurringGroup.status == "active",
    )
    sub_result = await db.execute(sub_query)
    subscriptions = sub_result.scalars().all()

    subscription_total = Decimal("0")
    for sub in subscriptions:
        amount = sub.estimated_amount or Decimal("0")
        if sub.frequency == "weekly":
            subscription_total += amount * 52 / 12
        elif sub.frequency == "monthly":
            subscription_total += amount
        elif sub.frequency == "quarterly":
            subscription_total += amount / 3
        elif sub.frequency == "annual":
            subscription_total += amount / 12

    return {
        "total_balance": float(total_balance),
        "monthly_income": float(monthly_income),
        "monthly_spending": float(monthly_spending),
        "subscription_total": float(subscription_total.quantize(Decimal("0.01"))),
        "transaction_count": transaction_count,
    }


async def get_category_breakdown(
    db: AsyncSession,
    user_id: UUID,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict]:
    """Spending breakdown by category for the given date range."""

    query = (
        select(
            Category.id,
            Category.name,
            Category.icon,
            Category.colour,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("transaction_count"),
        )
        .join(Account, Transaction.account_id == Account.id)
        .join(Category, Transaction.category_id == Category.id)
        .where(
            Account.user_id == user_id,
            Transaction.amount < 0,  # spending only
        )
    )

    if date_from:
        query = query.where(
            Transaction.date >= datetime.combine(date_from, datetime.min.time())
        )
    if date_to:
        query = query.where(
            Transaction.date <= datetime.combine(date_to, datetime.max.time())
        )

    query = query.group_by(Category.id, Category.name, Category.icon, Category.colour)
    query = query.order_by(
        func.sum(Transaction.amount).asc()
    )  # most spent first (negative)

    result = await db.execute(query)
    rows = result.all()

    # Total for percentage calculation
    grand_total = sum(abs(float(r.total)) for r in rows) or 1.0

    return [
        {
            "category_id": str(r.id),
            "category_name": r.name,
            "icon": r.icon,
            "colour": r.colour,
            "total": abs(float(r.total)),
            "percentage": round(abs(float(r.total)) / grand_total * 100, 1),
            "transaction_count": r.transaction_count,
        }
        for r in rows
    ]


async def get_spend_timeline(
    db: AsyncSession,
    user_id: UUID,
    granularity: str = "monthly",
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict]:
    """Daily/weekly/monthly income and spending over time."""

    # Default to last 6 months
    if date_to is None:
        date_to = date.today()
    if date_from is None:
        if granularity == "daily":
            date_from = date_to - timedelta(days=30)
        elif granularity == "weekly":
            date_from = date_to - timedelta(weeks=12)
        else:
            date_from = date(
                date_to.year - 1 if date_to.month <= 6 else date_to.year,
                (date_to.month - 6) % 12 or 12,
                1,
            )

    # Pull all transactions in range
    query = (
        select(Transaction.date, Transaction.amount)
        .join(Account, Transaction.account_id == Account.id)
        .where(
            Account.user_id == user_id,
            Transaction.date >= datetime.combine(date_from, datetime.min.time()),
            Transaction.date <= datetime.combine(date_to, datetime.max.time()),
        )
        .order_by(Transaction.date)
    )
    result = await db.execute(query)
    rows = result.all()

    # Group into buckets
    buckets: dict[str, dict] = {}
    for row in rows:
        txn_date = row.date.date() if hasattr(row.date, "date") else row.date
        if granularity == "daily":
            key = txn_date.isoformat()
        elif granularity == "weekly":
            # ISO week start (Monday)
            week_start = txn_date - timedelta(days=txn_date.weekday())
            key = week_start.isoformat()
        else:
            key = txn_date.strftime("%Y-%m")

        if key not in buckets:
            buckets[key] = {"date": key, "income": 0.0, "spending": 0.0, "net": 0.0}

        amount = float(row.amount)
        if amount > 0:
            buckets[key]["income"] += amount
        else:
            buckets[key]["spending"] += abs(amount)
        buckets[key]["net"] += amount

    # Round and return sorted
    for b in buckets.values():
        b["income"] = round(b["income"], 2)
        b["spending"] = round(b["spending"], 2)
        b["net"] = round(b["net"], 2)

    return sorted(buckets.values(), key=lambda x: x["date"])


async def get_top_merchants(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 5,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict]:
    """Top merchants by total spend."""

    query = (
        select(
            func.coalesce(Transaction.merchant_name, Transaction.description).label(
                "merchant"
            ),
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("transaction_count"),
            Category.name.label("category_name"),
        )
        .join(Account, Transaction.account_id == Account.id)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            Account.user_id == user_id,
            Transaction.amount < 0,  # spending only
        )
    )

    if date_from:
        query = query.where(
            Transaction.date >= datetime.combine(date_from, datetime.min.time())
        )
    if date_to:
        query = query.where(
            Transaction.date <= datetime.combine(date_to, datetime.max.time())
        )

    query = (
        query.group_by(
            func.coalesce(Transaction.merchant_name, Transaction.description),
            Category.name,
        )
        .order_by(func.sum(Transaction.amount).asc())  # most negative = most spent
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "merchant_name": r.merchant,
            "total": abs(float(r.total)),
            "transaction_count": r.transaction_count,
            "category_name": r.category_name,
        }
        for r in rows
    ]
