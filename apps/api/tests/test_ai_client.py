from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from app.ai.base import AIResponse, TokenUsage
from app.ai.client import INPUT_COST_PER_TOKEN, OUTPUT_COST_PER_TOKEN, AIClient


@pytest.fixture
def mock_response():
    """Create a mock Anthropic API response."""
    response = MagicMock()
    response.usage.input_tokens = 100
    response.usage.output_tokens = 50
    response.content = [MagicMock(text="Hello, world!")]
    return response


@pytest.fixture
def ai_client_instance():
    """Create a fresh AIClient for each test."""
    return AIClient()


@pytest.mark.asyncio
async def test_complete_returns_ai_response_on_success(
    ai_client_instance, mock_response
):
    """complete() returns AIResponse on success."""
    mock_anthropic_client = MagicMock()
    mock_anthropic_client.messages.create.return_value = mock_response

    ai_client_instance._client = mock_anthropic_client

    with patch("app.ai.client.settings") as mock_settings:
        mock_settings.anthropic_api_key = "test-key"

        result = await ai_client_instance.complete("Say hello")

    assert result is not None
    assert isinstance(result, AIResponse)
    assert result.content == "Hello, world!"
    assert result.success is True
    assert result.usage.input_tokens == 100
    assert result.usage.output_tokens == 50
    assert result.usage.model == "claude-sonnet-4-20250514"
    expected_cost = (
        Decimal(100) * INPUT_COST_PER_TOKEN + Decimal(50) * OUTPUT_COST_PER_TOKEN
    )
    assert result.usage.cost == expected_cost


@pytest.mark.asyncio
async def test_returns_none_when_api_key_empty(ai_client_instance):
    """Returns None when API key is empty."""
    with patch("app.ai.client.settings") as mock_settings:
        mock_settings.anthropic_api_key = ""

        result = await ai_client_instance.complete("Say hello")

    assert result is None


@pytest.mark.asyncio
async def test_retry_works_on_failure(ai_client_instance, mock_response):
    """Retry works: mock 2 failures then success."""
    mock_anthropic_client = MagicMock()
    mock_anthropic_client.messages.create.side_effect = [
        Exception("API error"),
        Exception("API error"),
        mock_response,
    ]

    ai_client_instance._client = mock_anthropic_client

    with (
        patch("app.ai.client.settings") as mock_settings,
        patch("asyncio.sleep", return_value=None) as mock_sleep,
    ):
        mock_settings.anthropic_api_key = "test-key"

        result = await ai_client_instance.complete("Say hello")

    assert result is not None
    assert result.content == "Hello, world!"
    assert result.success is True
    assert mock_anthropic_client.messages.create.call_count == 3
    # Should have slept twice (after attempt 0 and attempt 1)
    assert mock_sleep.call_count == 2


@pytest.mark.asyncio
async def test_returns_none_after_3_failures(ai_client_instance):
    """Returns None after 3 consecutive failures."""
    mock_anthropic_client = MagicMock()
    mock_anthropic_client.messages.create.side_effect = Exception("API error")

    ai_client_instance._client = mock_anthropic_client

    with (
        patch("app.ai.client.settings") as mock_settings,
        patch("asyncio.sleep", return_value=None),
    ):
        mock_settings.anthropic_api_key = "test-key"

        result = await ai_client_instance.complete("Say hello")

    assert result is None
    assert mock_anthropic_client.messages.create.call_count == 3


@pytest.mark.asyncio
async def test_cost_tracking_accumulates(ai_client_instance, mock_response):
    """Cost tracking accumulates correctly across calls."""
    mock_anthropic_client = MagicMock()
    mock_anthropic_client.messages.create.return_value = mock_response

    ai_client_instance._client = mock_anthropic_client

    with patch("app.ai.client.settings") as mock_settings:
        mock_settings.anthropic_api_key = "test-key"

        await ai_client_instance.complete("Call 1")
        await ai_client_instance.complete("Call 2")

    stats = ai_client_instance.stats
    assert stats["request_count"] == 2
    assert stats["total_input_tokens"] == 200
    assert stats["total_output_tokens"] == 100

    expected_cost_per_call = (
        Decimal(100) * INPUT_COST_PER_TOKEN + Decimal(50) * OUTPUT_COST_PER_TOKEN
    )
    assert stats["total_cost"] == str(expected_cost_per_call * 2)


@pytest.mark.asyncio
async def test_rate_limiter_tracks_request_times(ai_client_instance, mock_response):
    """Rate limiter tracks request times."""
    mock_anthropic_client = MagicMock()
    mock_anthropic_client.messages.create.return_value = mock_response

    ai_client_instance._client = mock_anthropic_client

    with patch("app.ai.client.settings") as mock_settings:
        mock_settings.anthropic_api_key = "test-key"

        await ai_client_instance.complete("Call 1")
        await ai_client_instance.complete("Call 2")
        await ai_client_instance.complete("Call 3")

    assert len(ai_client_instance._request_times) == 3
    # Request times should be in ascending order
    for i in range(1, len(ai_client_instance._request_times)):
        assert (
            ai_client_instance._request_times[i]
            >= ai_client_instance._request_times[i - 1]
        )


def test_token_usage_dataclass():
    """TokenUsage dataclass works correctly."""
    usage = TokenUsage(
        input_tokens=100, output_tokens=50, model="test", cost=Decimal("0.5")
    )
    assert usage.input_tokens == 100
    assert usage.output_tokens == 50
    assert usage.model == "test"
    assert usage.cost == Decimal("0.5")


def test_ai_response_dataclass():
    """AIResponse dataclass works correctly."""
    resp = AIResponse(content="test", success=True)
    assert resp.content == "test"
    assert resp.success is True
    assert resp.usage.input_tokens == 0  # default TokenUsage
