import csv
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation


def parse_monzo_csv(file_content: str) -> list[dict]:
    """Parse Monzo bank CSV export.

    Monzo CSVs have columns including:
    Date, Time, Transaction Type, Name, Amount, Currency,
    Notes and #tags, Description, Money Out, Money In.

    Amount is already signed: negative = outgoing, positive = incoming.
    Date format is DD/MM/YYYY.
    """
    transactions = []
    reader = csv.DictReader(io.StringIO(file_content))

    for row in reader:
        date_str = row.get("Date", "").strip()
        if not date_str:
            continue

        # Parse date DD/MM/YYYY
        try:
            date = datetime.strptime(date_str, "%d/%m/%Y")
        except ValueError:
            continue

        # Amount is already correctly signed in Monzo exports
        amount_str = (row.get("Amount") or "").strip().replace(",", "")
        if not amount_str:
            continue

        try:
            amount = Decimal(amount_str)
        except InvalidOperation:
            continue

        # Use Name as primary merchant, fall back to Description
        name = (row.get("Name") or "").strip()
        description = (row.get("Description") or "").strip()
        notes = (row.get("Notes and #tags") or "").strip()

        # Build a useful description from available fields
        display_description = description or name
        if notes:
            display_description = f"{display_description} — {notes}"

        if not name and not description:
            continue

        transactions.append(
            {
                "date": date,
                "description": display_description,
                "amount": amount,
                "merchant_name": name or description,
            }
        )

    return transactions
