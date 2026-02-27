import hashlib
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account, AccountType
from app.models.import_record import Import
from app.models.transaction import Transaction


# ── Format detection ──────────────────────────────────────────────────────────


def detect_format(filename: str, content: str) -> str | None:
    """
    Detect the bank format from the CSV headers or filename.
    Returns: 'amex' | 'hsbc' | None
    """
    first_line = content.split("\n")[0].lower()

    # Amex: Date,Description,Amount (3 cols, no balance)
    if "date" in first_line and "description" in first_line and "amount" in first_line:
        if "paid out" not in first_line and "paid in" not in first_line:
            return "amex"

    # HSBC: Date,Description,Paid Out,Paid In,Balance  OR  Date,Description,Amount,Balance
    if "paid out" in first_line or "paid in" in first_line:
        return "hsbc"
    if "balance" in first_line and "date" in first_line:
        return "hsbc"

    # Filename hints as fallback
    fname = filename.lower()
    if "amex" in fname or "american_express" in fname:
        return "amex"
    if "hsbc" in fname:
        return "hsbc"

    return None


# ── Duplicate detection ───────────────────────────────────────────────────────


def _txn_hash(account_id: uuid.UUID, date: Any, amount: Any, description: str) -> str:
    """Stable hash for duplicate detection: account + date + amount + description."""
    key = f"{account_id}|{date.date() if hasattr(date, 'date') else date}|{amount}|{description.strip().lower()}"
    return hashlib.sha256(key.encode()).hexdigest()


async def get_existing_hashes(db: AsyncSession, account_id: uuid.UUID) -> set[str]:
    """Load all existing transaction hashes for this account."""
    result = await db.execute(
        select(Transaction.date, Transaction.amount, Transaction.description).where(
            Transaction.account_id == account_id
        )
    )
    return {
        _txn_hash(account_id, row.date, row.amount, row.description)
        for row in result.all()
    }


# ── Account resolution ────────────────────────────────────────────────────────


async def get_or_create_account(
    db: AsyncSession,
    user_id: uuid.UUID,
    bank_format: str,
) -> Account:
    """
    Find an existing account for this bank, or create one.
    In V1 single-user mode, one account per bank provider.
    """
    provider_map = {
        "amex": ("Amex", AccountType.credit_card),
        "hsbc": ("HSBC", AccountType.current),
    }
    provider, account_type = provider_map.get(
        bank_format, ("Unknown", AccountType.current)
    )

    # Try to find existing account for this provider
    result = await db.execute(
        select(Account)
        .where(Account.user_id == user_id)
        .where(Account.provider == provider)
        .where(Account.is_active == True)  # noqa: E712
    )
    account = result.scalar_one_or_none()

    if account is None:
        account = Account(
            id=uuid.uuid4(),
            user_id=user_id,
            name=f"{provider} Account",
            type=account_type,
            provider=provider,
            currency="GBP",
            current_balance=0,
            is_active=True,
        )
        db.add(account)
        await db.flush()

    return account


# ── Main import function ──────────────────────────────────────────────────────


async def process_import(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    filename: str,
    content: str,
) -> Import:
    """
    Full import pipeline:
    1. Detect bank format
    2. Parse rows
    3. Find/create account
    4. Deduplicate
    5. Save transactions
    6. Save import record
    7. Return import record (caller triggers Celery tasks)
    """
    from app.services.parsers import parse_amex_csv, parse_hsbc_csv

    # Detect format
    bank_format = detect_format(filename, content)
    if bank_format is None:
        raise ValueError(
            "Could not detect bank format. Supported formats: Amex CSV, HSBC CSV. "
            "Make sure the file has the correct headers."
        )

    # Parse
    if bank_format == "amex":
        rows = parse_amex_csv(content)
    elif bank_format == "hsbc":
        rows = parse_hsbc_csv(content)
    else:
        raise ValueError(f"No parser for format: {bank_format}")

    if not rows:
        raise ValueError("No transactions found in file. Check the file isn't empty.")

    # Find/create account
    account = await get_or_create_account(db, user_id, bank_format)

    # Create import record (processing)
    import_record = Import(
        id=uuid.uuid4(),
        user_id=user_id,
        account_id=account.id,
        filename=filename,
        file_type="csv",
        status="processing",
        row_count=0,
        duplicates_skipped=0,
    )
    db.add(import_record)
    await db.flush()

    # Deduplicate
    existing_hashes = await get_existing_hashes(db, account.id)
    new_transactions = []
    duplicates = 0

    for row in rows:
        h = _txn_hash(account.id, row["date"], row["amount"], row["description"])
        if h in existing_hashes:
            duplicates += 1
            continue
        existing_hashes.add(h)  # prevent dupes within the same file

        # Make date timezone-aware
        txn_date = row["date"]
        if hasattr(txn_date, "tzinfo") and txn_date.tzinfo is None:
            from datetime import timezone as tz

            txn_date = txn_date.replace(tzinfo=tz.utc)

        txn = Transaction(
            id=uuid.uuid4(),
            account_id=account.id,
            date=txn_date,
            description=row["description"],
            amount=row["amount"],
            balance_after=row.get("balance_after"),
            merchant_name=row.get("merchant_name", row["description"]),
            import_id=import_record.id,
            tags=[],
        )
        new_transactions.append(txn)
        db.add(txn)

    # Update import record
    dates = [t.date for t in new_transactions]
    import_record.row_count = len(new_transactions)
    import_record.duplicates_skipped = duplicates
    import_record.status = "completed"
    if dates:
        import_record.date_range_start = min(
            d.date() if hasattr(d, "date") else d for d in dates
        )
        import_record.date_range_end = max(
            d.date() if hasattr(d, "date") else d for d in dates
        )

    # Update account balance to most recent balance_after if available
    balance_rows = [
        (t.date, t.balance_after)
        for t in new_transactions
        if t.balance_after is not None
    ]
    if balance_rows:
        latest_balance = sorted(balance_rows, key=lambda x: x[0])[-1][1]
        account.current_balance = latest_balance

    await db.commit()
    await db.refresh(import_record)
    return import_record, [str(t.id) for t in new_transactions]
