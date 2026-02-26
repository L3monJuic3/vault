import csv
import io
from datetime import datetime
from decimal import Decimal


def parse_hsbc_csv(file_content: str) -> list[dict]:
    """Parse HSBC UK CSV bank statement export.

    Handles two common formats:
    1. Date, Type, Description, Paid Out, Paid In, Balance
    2. Date, Description, Amount

    Handles multi-line descriptions by joining them.
    """
    transactions = []
    reader = csv.DictReader(io.StringIO(file_content))

    fieldnames = reader.fieldnames or []
    has_paid_columns = "Paid Out" in fieldnames or "Paid out" in fieldnames

    for row in reader:
        date_str = row.get("Date", "").strip()
        if not date_str:
            continue

        # Parse date DD/MM/YYYY
        try:
            date = datetime.strptime(date_str, "%d/%m/%Y")
        except ValueError:
            continue

        # Get description - clean up multi-line
        description = row.get("Description", row.get("Memo", "")).strip()
        description = " ".join(description.split())  # Collapse whitespace/newlines

        if not description:
            continue

        # Parse amount based on format
        if has_paid_columns:
            paid_out = (
                row.get("Paid Out", row.get("Paid out", "")).strip().replace(",", "")
            )
            paid_in = (
                row.get("Paid In", row.get("Paid in", "")).strip().replace(",", "")
            )

            if paid_out:
                amount = -Decimal(paid_out)
            elif paid_in:
                amount = Decimal(paid_in)
            else:
                continue
        else:
            amount_str = row.get("Amount", "").strip().replace(",", "")
            if not amount_str:
                continue
            amount = Decimal(amount_str)

        # Balance
        balance_str = row.get("Balance", "").strip().replace(",", "")
        balance_after = Decimal(balance_str) if balance_str else None

        transactions.append(
            {
                "date": date,
                "description": description,
                "amount": amount,
                "balance_after": balance_after,
                "merchant_name": description,
            }
        )

    return transactions
