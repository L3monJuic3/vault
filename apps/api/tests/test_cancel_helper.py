import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.ai.base import AIResponse, TokenUsage
from app.ai.cancel_helper import clear_cache, enrich_cancellation_info


def _make_group(
    merchant_name="Netflix",
    name="Netflix",
    rec_type="subscription",
    cancel_url=None,
    cancel_steps=None,
):
    """Create a mock RecurringGroup object."""
    group = MagicMock()
    group.merchant_name = merchant_name
    group.name = name
    group.type = rec_type
    group.cancel_url = cancel_url
    group.cancel_steps = cancel_steps
    return group


def _make_ai_response(items: list[dict]) -> AIResponse:
    """Build an AIResponse containing the JSON for cancellation info."""
    content = json.dumps(items)
    return AIResponse(
        content=content,
        usage=TokenUsage(input_tokens=100, output_tokens=50),
        success=True,
    )


@pytest.fixture(autouse=True)
def _clear_cancel_cache():
    """Clear the cancellation cache before each test."""
    clear_cache()
    yield
    clear_cache()


@pytest.mark.asyncio
async def test_sets_cancel_fields_on_subscription_groups():
    """Sets cancel_url and cancel_steps on subscription-type groups."""
    group = _make_group(merchant_name="Netflix", rec_type="subscription")

    ai_response = _make_ai_response(
        [
            {
                "merchant": "Netflix",
                "cancel_url": "https://netflix.com/cancelplan",
                "cancel_steps": "1. Go to Account\n2. Click Cancel Membership\n3. Confirm",
                "confidence": 0.95,
            }
        ]
    )

    with patch("app.ai.cancel_helper.ai_client") as mock_client:
        mock_client.complete = AsyncMock(return_value=ai_response)
        await enrich_cancellation_info([group])

    assert group.cancel_url == "https://netflix.com/cancelplan"
    assert "Cancel Membership" in group.cancel_steps


@pytest.mark.asyncio
async def test_skips_non_subscription_types():
    """Skips non-subscription types (salary, direct_debit, standing_order)."""
    salary = _make_group(merchant_name="Employer Ltd", rec_type="salary")
    dd = _make_group(merchant_name="Council Tax", rec_type="direct_debit")
    so = _make_group(merchant_name="Landlord", rec_type="standing_order")

    with patch("app.ai.cancel_helper.ai_client") as mock_client:
        mock_client.complete = AsyncMock()
        await enrich_cancellation_info([salary, dd, so])

    # AI should not be called at all
    mock_client.complete.assert_not_called()
    assert salary.cancel_url is None
    assert dd.cancel_url is None
    assert so.cancel_url is None


@pytest.mark.asyncio
async def test_caches_results_by_merchant_name():
    """Cache works: second call for same merchant skips AI."""
    group1 = _make_group(merchant_name="Spotify", rec_type="subscription")

    ai_response = _make_ai_response(
        [
            {
                "merchant": "Spotify",
                "cancel_url": "https://spotify.com/account",
                "cancel_steps": "1. Open Settings\n2. Cancel Premium",
                "confidence": 0.9,
            }
        ]
    )

    with patch("app.ai.cancel_helper.ai_client") as mock_client:
        mock_client.complete = AsyncMock(return_value=ai_response)

        # First call — hits AI
        await enrich_cancellation_info([group1])
        assert mock_client.complete.call_count == 1
        assert group1.cancel_url == "https://spotify.com/account"

        # Second call — should use cache
        group2 = _make_group(merchant_name="Spotify", rec_type="subscription")
        await enrich_cancellation_info([group2])
        assert mock_client.complete.call_count == 1  # No additional AI call
        assert group2.cancel_url == "https://spotify.com/account"


@pytest.mark.asyncio
async def test_graceful_on_ai_failure():
    """AI failure returns without modifying groups."""
    group = _make_group(merchant_name="Netflix", rec_type="subscription")

    with patch("app.ai.cancel_helper.ai_client") as mock_client:
        mock_client.complete = AsyncMock(return_value=None)
        await enrich_cancellation_info([group])

    # Fields should remain unchanged (MagicMock default)
    assert group.cancel_url is None
    assert group.cancel_steps is None


@pytest.mark.asyncio
async def test_skips_low_confidence_results():
    """Results with confidence < 0.6 are ignored."""
    group = _make_group(merchant_name="ObscureService", rec_type="subscription")

    ai_response = _make_ai_response(
        [
            {
                "merchant": "ObscureService",
                "cancel_url": "https://example.com/cancel",
                "cancel_steps": "1. Maybe try this",
                "confidence": 0.3,
            }
        ]
    )

    with patch("app.ai.cancel_helper.ai_client") as mock_client:
        mock_client.complete = AsyncMock(return_value=ai_response)
        await enrich_cancellation_info([group])

    assert group.cancel_url is None
    assert group.cancel_steps is None


@pytest.mark.asyncio
async def test_handles_malformed_json_response():
    """Malformed JSON response is handled gracefully."""
    group = _make_group(merchant_name="Netflix", rec_type="subscription")

    bad_response = AIResponse(
        content="not valid json {{{",
        usage=TokenUsage(input_tokens=50, output_tokens=20),
        success=True,
    )

    with patch("app.ai.cancel_helper.ai_client") as mock_client:
        mock_client.complete = AsyncMock(return_value=bad_response)
        await enrich_cancellation_info([group])

    assert group.cancel_url is None
    assert group.cancel_steps is None


@pytest.mark.asyncio
async def test_empty_groups_list():
    """Empty input returns immediately without calling AI."""
    with patch("app.ai.cancel_helper.ai_client") as mock_client:
        mock_client.complete = AsyncMock()
        await enrich_cancellation_info([])

    mock_client.complete.assert_not_called()


@pytest.mark.asyncio
async def test_mixed_types_only_enriches_subscriptions():
    """Mixed group types: only subscription types are enriched."""
    sub = _make_group(merchant_name="Netflix", rec_type="subscription")
    salary = _make_group(merchant_name="Employer", rec_type="salary")

    ai_response = _make_ai_response(
        [
            {
                "merchant": "Netflix",
                "cancel_url": "https://netflix.com/cancel",
                "cancel_steps": "1. Go to Account\n2. Cancel",
                "confidence": 0.95,
            }
        ]
    )

    with patch("app.ai.cancel_helper.ai_client") as mock_client:
        mock_client.complete = AsyncMock(return_value=ai_response)
        await enrich_cancellation_info([sub, salary])

    assert sub.cancel_url == "https://netflix.com/cancel"
    assert salary.cancel_url is None
