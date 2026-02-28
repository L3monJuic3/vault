import json
import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import ai_client
from app.models.category import Category
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

# In-memory merchant->category cache
_merchant_cache: dict[str, dict] = {}


async def categorise_transactions(
    db: AsyncSession,
    transactions: list[Transaction],
    user_id: UUID,
) -> list[dict]:
    """Batch categorise transactions using Claude AI.

    Returns list of dicts: {transaction_id, category_name, confidence, merchant_name}
    """
    if not transactions:
        return []

    # Check cache first
    uncached = []
    results = []
    for txn in transactions:
        # Skip if user manually set category (user override)
        if txn.category_id is not None and txn.ai_confidence is None:
            continue

        cache_key = (txn.merchant_name or txn.description).lower().strip()
        if cache_key in _merchant_cache:
            cached = _merchant_cache[cache_key]
            results.append(
                {
                    "transaction_id": txn.id,
                    "category_name": cached["category_name"],
                    "confidence": cached["confidence"],
                    "merchant_name": cached["merchant_name"],
                }
            )
        else:
            uncached.append(txn)

    if not uncached:
        return results

    # Get available categories
    cat_result = await db.execute(
        select(Category).where(
            (Category.user_id.is_(None)) | (Category.user_id == user_id)
        )
    )
    categories = cat_result.scalars().all()
    category_names = [c.name for c in categories]

    # Batch in groups of 30
    batch_size = 30
    for i in range(0, len(uncached), batch_size):
        batch = uncached[i : i + batch_size]
        batch_results = await _categorise_batch(batch, category_names)  # type: ignore[arg-type]
        results.extend(batch_results)

        # Update cache for high-confidence results
        for r in batch_results:
            if r["confidence"] >= 0.9:
                cache_key = r["merchant_name"].lower().strip()
                _merchant_cache[cache_key] = {
                    "category_name": r["category_name"],
                    "confidence": r["confidence"],
                    "merchant_name": r["merchant_name"],
                }

    return results


async def _categorise_batch(
    transactions: list[Transaction],
    category_names: list[str],
) -> list[dict]:
    """Send a batch of transactions to Claude for categorisation."""
    txn_list = []
    for txn in transactions:
        txn_list.append(
            {
                "id": str(txn.id),
                "description": txn.description,
                "amount": str(txn.amount),
                "merchant": txn.merchant_name or txn.description,
            }
        )

    prompt = f"""Categorise these bank transactions into the following categories:
{json.dumps(category_names)}

Transactions:
{json.dumps(txn_list, indent=2)}

For each transaction, respond with a JSON array of objects:
[
  {{
    "id": "transaction-uuid",
    "category": "category name",
    "confidence": 0.95,
    "merchant": "Normalised Merchant Name"
  }}
]

Rules:
- confidence is 0.0 to 1.0
- Normalise merchant names (e.g., "AMZN*RT5KX" -> "Amazon", "DELIVEROO.COM" -> "Deliveroo")
- Only use categories from the provided list
- Respond ONLY with the JSON array, no other text
"""

    response = await ai_client.complete(
        prompt,
        system_prompt="You are a financial transaction categoriser. Respond only with valid JSON.",
    )

    if response is None:
        logger.warning("AI categorisation failed — returning empty results")
        return []

    try:
        parsed = json.loads(response.content)
        results = []
        for item in parsed:
            results.append(
                {
                    "transaction_id": UUID(item["id"]),
                    "category_name": item["category"],
                    "confidence": float(item["confidence"]),
                    "merchant_name": item["merchant"],
                }
            )
        return results
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.error(f"Failed to parse AI categorisation response: {e}")
        return []


def clear_cache():
    """Clear the merchant cache (for testing)."""
    _merchant_cache.clear()
