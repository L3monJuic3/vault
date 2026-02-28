"""Seed demo data for Vault development.

Generates 6 months of realistic UK transaction data.

Run: cd apps/api && python scripts/seed_demo_data.py
"""

import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.account import Account, AccountType
from app.models.category import Category
from app.models.recurring_group import (
    Frequency,
    RecurringGroup,
    RecurringStatus,
    RecurringType,
)
from app.models.transaction import Transaction
from app.models.user import User
from app.services.auth_service import hash_password

# ---------------------------------------------------------------------------
# Merchant definitions: (name, category_name, min_amount, max_amount)
# ---------------------------------------------------------------------------
MERCHANTS: dict[str, list[tuple[str, str, int, int]]] = {
    "groceries": [
        ("TESCO STORES", "Food & Drink", 30, 80),
        ("SAINSBURYS", "Food & Drink", 25, 70),
        ("WAITROSE", "Food & Drink", 40, 100),
        ("ALDI", "Food & Drink", 20, 50),
        ("M&S FOOD", "Food & Drink", 15, 45),
    ],
    "transport": [
        ("TFL.GOV.UK/CP", "Transport", 2, 3),
        ("UBER *TRIP", "Transport", 8, 25),
        ("SHELL PETROL", "Transport", 40, 65),
    ],
    "eating_out": [
        ("DELIVEROO", "Food & Drink", 15, 30),
        ("PRET A MANGER", "Food & Drink", 4, 8),
        ("COSTA COFFEE", "Food & Drink", 3, 5),
        ("NANDOS", "Food & Drink", 12, 25),
        ("WAGAMAMA", "Food & Drink", 14, 22),
    ],
    "shopping": [
        ("AMAZON.CO.UK", "Shopping", 10, 100),
        ("ASOS.COM", "Shopping", 20, 80),
        ("JOHN LEWIS", "Shopping", 30, 200),
        ("ZARA", "Shopping", 25, 75),
    ],
    "entertainment": [
        ("ODEON CINEMA", "Entertainment", 10, 20),
        ("WATERSTONES", "Entertainment", 8, 20),
    ],
    "health": [
        ("BOOTS", "Health", 5, 30),
        ("SUPERDRUG", "Health", 3, 15),
    ],
    "bills": [
        ("COUNCIL TAX", "Housing", 150, 160),
        ("EDF ENERGY", "Housing", 80, 120),
        ("THAMES WATER", "Housing", 30, 40),
        ("THREE MOBILE", "Subscriptions", 20, 20),
    ],
}

SUBSCRIPTIONS = [
    {
        "name": "Netflix",
        "merchant": "NETFLIX.COM",
        "amount": Decimal("15.99"),
        "frequency": Frequency.monthly,
        "type": RecurringType.subscription,
        "category": "Subscriptions",
        "status": RecurringStatus.active,
    },
    {
        "name": "Spotify",
        "merchant": "SPOTIFY.COM",
        "amount": Decimal("10.99"),
        "frequency": Frequency.monthly,
        "type": RecurringType.subscription,
        "category": "Subscriptions",
        "status": RecurringStatus.active,
    },
    {
        "name": "PureGym",
        "merchant": "PUREGYM",
        "amount": Decimal("24.99"),
        "frequency": Frequency.monthly,
        "type": RecurringType.direct_debit,
        "category": "Health",
        "status": RecurringStatus.active,
    },
    {
        "name": "iCloud",
        "merchant": "APPLE.COM/BILL",
        "amount": Decimal("2.99"),
        "frequency": Frequency.monthly,
        "type": RecurringType.subscription,
        "category": "Subscriptions",
        "status": RecurringStatus.active,
    },
    {
        "name": "Amazon Prime",
        "merchant": "AMAZON PRIME",
        "amount": Decimal("95.00"),
        "frequency": Frequency.annual,
        "type": RecurringType.subscription,
        "category": "Subscriptions",
        "status": RecurringStatus.active,
    },
    {
        "name": "Deliveroo Plus",
        "merchant": "DELIVEROO PLUS",
        "amount": Decimal("3.49"),
        "frequency": Frequency.monthly,
        "type": RecurringType.subscription,
        "category": "Food & Drink",
        "status": RecurringStatus.uncertain,
    },
]


def _random_amount(min_val: int, max_val: int) -> Decimal:
    """Return a random Decimal amount between min_val and max_val (inclusive)."""
    return Decimal(str(round(random.uniform(min_val, max_val), 2)))


async def seed_demo_data() -> None:
    """Seed a complete demo dataset — idempotent (skips if demo user exists)."""
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with session_factory() as db:
        # ------------------------------------------------------------------
        # Idempotency: bail out if the demo user already exists
        # ------------------------------------------------------------------
        result = await db.execute(select(User).where(User.email == "default@vault.local"))
        existing_user = result.scalar_one_or_none()
        if existing_user is not None:
            # Check if demo data was already seeded (user has transactions)
            from sqlalchemy import func
            from app.models.account import Account as AccountModel
            tx_count = await db.execute(
                select(func.count(Transaction.id)).join(
                    AccountModel, Transaction.account_id == AccountModel.id
                ).where(AccountModel.user_id == existing_user.id)
            )
            if tx_count.scalar() > 0:
                print("Demo data already seeded — skipping.")
                await engine.dispose()
                return
            user = existing_user
        else:
            # ------------------------------------------------------------------
            # 1. Create default user (normally auto-created by auth middleware)
            # ------------------------------------------------------------------
            user = User(
                id=uuid.uuid4(),
                email="default@vault.local",
                name="Default User",
                password_hash=hash_password("demo123"),
                currency="GBP",
            )
            db.add(user)
            await db.flush()

        # ------------------------------------------------------------------
        # 2. Create accounts
        # ------------------------------------------------------------------
        monzo = Account(
            id=uuid.uuid4(),
            user_id=user.id,
            name="Monzo Current",
            type=AccountType.current,
            provider="Monzo",
            currency="GBP",
            current_balance=Decimal("3245.67"),
            is_active=True,
        )
        amex = Account(
            id=uuid.uuid4(),
            user_id=user.id,
            name="Amex Gold",
            type=AccountType.credit_card,
            provider="American Express",
            currency="GBP",
            current_balance=Decimal("-1234.56"),
            is_active=True,
        )
        db.add(monzo)
        db.add(amex)
        await db.flush()

        # ------------------------------------------------------------------
        # 3. Load system categories (seeded by seed_categories.py)
        # ------------------------------------------------------------------
        cat_result = await db.execute(
            select(Category).where(Category.user_id.is_(None))
        )
        categories: dict[str, uuid.UUID] = {
            c.name: c.id for c in cat_result.scalars().all()
        }

        # ------------------------------------------------------------------
        # 4. Generate transactions — 6 months of daily spending
        # ------------------------------------------------------------------
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=180)
        transactions: list[Transaction] = []
        current_date = start_date

        while current_date <= now:
            day_of_month = current_date.day

            # Monthly salary on the 28th
            if day_of_month == 28:
                salary_amount = _random_amount(3400, 3600)
                transactions.append(
                    Transaction(
                        id=uuid.uuid4(),
                        account_id=monzo.id,
                        date=current_date.replace(hour=7, minute=0, second=0),
                        description="ACME CORP SALARY",
                        amount=salary_amount,
                        merchant_name="ACME CORP",
                        category_id=categories.get("Income"),
                        is_recurring=True,
                        tags=[],
                    )
                )

            # Daily random transactions (1-5 per day)
            num_daily = random.randint(1, 5)
            for _ in range(num_daily):
                category_key = random.choice(list(MERCHANTS.keys()))
                merchant_info = random.choice(MERCHANTS[category_key])
                name, cat_name, min_amt, max_amt = merchant_info
                amount = -_random_amount(min_amt, max_amt)  # spending is negative

                # 70 % Monzo, 30 % Amex
                account = monzo if random.random() < 0.7 else amex

                transactions.append(
                    Transaction(
                        id=uuid.uuid4(),
                        account_id=account.id,
                        date=current_date
                        + timedelta(
                            hours=random.randint(8, 22),
                            minutes=random.randint(0, 59),
                        ),
                        description=name,
                        amount=amount,
                        merchant_name=name,
                        category_id=categories.get(cat_name),
                        is_recurring=False,
                        tags=[],
                    )
                )

            current_date += timedelta(days=1)

        # ------------------------------------------------------------------
        # 5. Subscription transactions (monthly pattern on ~15th)
        # ------------------------------------------------------------------
        for sub in SUBSCRIPTIONS:
            if sub["frequency"] == Frequency.monthly:
                sub_date = start_date.replace(day=15, hour=3, minute=0, second=0)
                while sub_date <= now:
                    transactions.append(
                        Transaction(
                            id=uuid.uuid4(),
                            account_id=monzo.id,
                            date=sub_date + timedelta(hours=random.randint(0, 12)),
                            description=sub["merchant"],
                            amount=-sub["amount"],
                            merchant_name=sub["merchant"],
                            category_id=categories.get(sub["category"]),
                            is_recurring=True,
                            tags=[],
                        )
                    )
                    # Advance roughly one month
                    sub_date += timedelta(days=30)
            elif sub["frequency"] == Frequency.annual:
                # Single annual charge within the 6-month window
                annual_date = start_date + timedelta(days=random.randint(30, 150))
                transactions.append(
                    Transaction(
                        id=uuid.uuid4(),
                        account_id=monzo.id,
                        date=annual_date,
                        description=sub["merchant"],
                        amount=-sub["amount"],
                        merchant_name=sub["merchant"],
                        category_id=categories.get(sub["category"]),
                        is_recurring=True,
                        tags=[],
                    )
                )

        # ------------------------------------------------------------------
        # 6. Bill transactions (monthly pattern on ~5th)
        # ------------------------------------------------------------------
        for bill_info in MERCHANTS["bills"]:
            name, cat_name, min_amt, max_amt = bill_info
            bill_date = start_date.replace(day=5, hour=6, minute=0, second=0)
            while bill_date <= now:
                transactions.append(
                    Transaction(
                        id=uuid.uuid4(),
                        account_id=monzo.id,
                        date=bill_date,
                        description=name,
                        amount=-_random_amount(min_amt, max_amt),
                        merchant_name=name,
                        category_id=categories.get(cat_name),
                        is_recurring=True,
                        tags=[],
                    )
                )
                bill_date += timedelta(days=30)

        # Bulk-insert all transactions
        db.add_all(transactions)
        await db.flush()

        # ------------------------------------------------------------------
        # 7. RecurringGroup records for subscriptions
        # ------------------------------------------------------------------
        for sub in SUBSCRIPTIONS:
            group = RecurringGroup(
                id=uuid.uuid4(),
                user_id=user.id,
                name=sub["name"],
                type=sub["type"],
                frequency=sub["frequency"],
                estimated_amount=sub["amount"],
                status=sub["status"],
                category_id=categories.get(sub["category"]),
                merchant_name=sub["merchant"],
                next_expected_date=(now + timedelta(days=random.randint(1, 30))).date(),
            )
            db.add(group)

        await db.commit()
        print(
            f"Seeded demo data: {len(transactions)} transactions, "
            f"{len(SUBSCRIPTIONS)} subscriptions"
        )

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
