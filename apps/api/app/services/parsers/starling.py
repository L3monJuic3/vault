import csv
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation


def parse_starling_csv(file_content: str) -> list[dict]:
    """Parse Starling Bank CSV export.

    Starling CSVs have columns:
    Date, Counter Party, Reference, Type, Amount (GBP), Balance (GBP),
    Spending Category.

    Amount is already signed: negative = outgoing, positive = incoming.
    Date format is DD/MM/YYYY.
    """
    transactions = []
    reader = csv.DictReader(io.StringIO(file_content))

    for row in reader:
        date_str = (row.get("Date") or "").strip()
        if not date_str:
            continue

        # Parse date DD/MM/YYYY
        try:
            date = datetime.strptime(date_str, "%d/%m/%Y")
        except ValueError:
            continue

        # Amount column may include currency code in header
        amount_str = ""
        for key in row:
            if key is not None and key.startswith("Amount"):
                amount_str = (row.get(key) or "").strip().replace(",", "")
                break

        if not amount_str:
            continue

        try:
            amount = Decimal(amount_str)
        except InvalidOperation:
            continue

        # Counter Party is the merchant name
        counter_party = (row.get("Counter Party") or "").strip()
        reference = (row.get("Reference") or "").strip()

        # Use reference as description, counter party as merchant
        description = reference or counter_party
        merchant_name = counter_party or reference

        if not description and not merchant_name:
            continue

        # Balance column may include currency code in header
        balance_after = None
        for key in row:
            if key is not None and key.startswith("Balance"):
                balance_str = (row.get(key) or "").strip().replace(",", "")
                if balance_str:
                    try:
                        balance_after = Decimal(balance_str)
                    except InvalidOperation:
                        balance_after = None
                break

        transactions.append(
            {
                "date": date,
                "description": description,
                "amount": amount,
                "balance_after": balance_after,
                "merchant_name": merchant_name,
            }
        )

    return transactions
