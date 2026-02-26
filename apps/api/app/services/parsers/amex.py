import csv
import io
from datetime import datetime
from decimal import Decimal


def parse_amex_csv(file_content: str) -> list[dict]:
    """Parse American Express CSV export.

    Amex uses positive amounts for charges. We flip the sign:
    positive charge -> negative amount (outgoing).
    Payments/credits remain positive (incoming).
    """
    transactions = []
    reader = csv.DictReader(io.StringIO(file_content))

    for row in reader:
        # Try common Amex column names
        date_str = row.get("Date", "").strip()
        description = row.get("Description", row.get("description", "")).strip()
        amount_str = row.get("Amount", row.get("amount", "")).strip()

        if not date_str or not amount_str:
            continue

        # Parse date - try DD/MM/YYYY first (UK), then MM/DD/YYYY
        date = None
        for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d"):
            try:
                date = datetime.strptime(date_str, fmt)
                break
            except ValueError:
                continue

        if date is None:
            continue

        # Parse amount and flip sign for charges
        amount = Decimal(amount_str.replace(",", ""))
        # Amex: positive = charge (spending), negative = payment/credit
        # Our system: negative = outgoing, positive = incoming
        amount = -amount

        transactions.append(
            {
                "date": date,
                "description": description,
                "amount": amount,
                "merchant_name": description,
            }
        )

    return transactions
