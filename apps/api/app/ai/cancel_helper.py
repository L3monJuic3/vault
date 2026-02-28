import json
import logging

from app.ai.client import ai_client
from app.models.recurring_group import RecurringGroup

logger = logging.getLogger(__name__)

# In-memory merchant -> cancellation info cache
_cancel_cache: dict[str, dict] = {}

BATCH_SIZE = 20


async def enrich_cancellation_info(groups: list[RecurringGroup]) -> None:
    """Enrich subscription-type RecurringGroups with cancellation instructions.

    Sets cancel_url and cancel_steps on each group in-place.
    Only processes groups with type == "subscription".
    Fails gracefully — logs warning and returns if AI is unavailable.
    """
    subs = [g for g in groups if g.type == "subscription"]
    if not subs:
        return

    # Check cache first, collect uncached
    uncached = []
    for sub in subs:
        cache_key = (sub.merchant_name or sub.name).lower().strip()
        if cache_key in _cancel_cache:
            cached = _cancel_cache[cache_key]
            sub.cancel_url = cached["cancel_url"]
            sub.cancel_steps = cached["cancel_steps"]
        else:
            uncached.append(sub)

    if not uncached:
        return

    # Batch uncached merchants
    for i in range(0, len(uncached), BATCH_SIZE):
        batch = uncached[i : i + BATCH_SIZE]
        await _enrich_batch(batch)


async def _enrich_batch(subs: list[RecurringGroup]) -> None:
    """Send a batch of merchants to Claude for cancellation info."""
    merchants = []
    for sub in subs:
        merchants.append(sub.merchant_name or sub.name)

    prompt = f"""For each subscription service below, provide cancellation instructions.

Services:
{json.dumps(merchants)}

For each service, respond with a JSON array of objects:
[
  {{
    "merchant": "Service Name",
    "cancel_url": "https://example.com/cancel",
    "cancel_steps": "1. Log in to your account\\n2. Go to Settings > Subscription\\n3. Click Cancel Subscription\\n4. Confirm cancellation",
    "confidence": 0.9
  }}
]

Rules:
- cancel_url should be the direct URL to the cancellation page if known, or null if unknown
- cancel_steps should be numbered plain-text steps for cancelling
- confidence is 0.0 to 1.0 — how confident you are the info is accurate
- If you don't know the cancellation process, set confidence to 0.0
- Respond ONLY with the JSON array, no other text
"""

    response = await ai_client.complete(
        prompt,
        system_prompt="You are a helpful assistant that provides accurate subscription cancellation instructions. Respond only with valid JSON.",
    )

    if response is None:
        logger.warning("AI cancellation enrichment failed — skipping")
        return

    try:
        parsed = json.loads(response.content)
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"Failed to parse AI cancellation response: {e}")
        return

    # Build lookup by normalised merchant name
    result_map: dict[str, dict] = {}
    for item in parsed:
        if not isinstance(item, dict):
            continue
        merchant = item.get("merchant", "")
        confidence = float(item.get("confidence", 0))
        if confidence < 0.6:
            continue
        result_map[merchant.lower().strip()] = {
            "cancel_url": item.get("cancel_url"),
            "cancel_steps": item.get("cancel_steps"),
        }

    # Apply results and update cache
    for sub in subs:
        merchant_name = sub.merchant_name or sub.name
        key = merchant_name.lower().strip()
        info = result_map.get(key)
        if info:
            sub.cancel_url = info["cancel_url"]
            sub.cancel_steps = info["cancel_steps"]
            _cancel_cache[key] = info


def clear_cache():
    """Clear the cancellation cache (for testing)."""
    _cancel_cache.clear()
