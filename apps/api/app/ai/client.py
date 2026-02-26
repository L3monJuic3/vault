import asyncio
import logging
import time
from decimal import Decimal

from app.ai.base import AIResponse, TokenUsage
from app.config import settings

logger = logging.getLogger(__name__)

# Cost per token (approximate, Claude Sonnet)
INPUT_COST_PER_TOKEN = Decimal("0.000003")
OUTPUT_COST_PER_TOKEN = Decimal("0.000015")


class AIClient:
    def __init__(self):
        self._client = None
        self._request_count = 0
        self._total_input_tokens = 0
        self._total_output_tokens = 0
        self._total_cost = Decimal("0")
        self._rate_limit = 50  # requests per minute
        self._request_times: list[float] = []

    def _get_client(self):
        if self._client is None:
            if not settings.anthropic_api_key:
                return None
            try:
                import anthropic

                self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            except Exception:
                logger.exception("Failed to initialize Anthropic client")
                return None
        return self._client

    async def _wait_for_rate_limit(self):
        """Simple rate limiter: wait if too many requests in the last minute."""
        now = time.time()
        self._request_times = [t for t in self._request_times if now - t < 60]
        if len(self._request_times) >= self._rate_limit:
            wait_time = 60 - (now - self._request_times[0])
            if wait_time > 0:
                logger.info(f"Rate limit reached, waiting {wait_time:.1f}s")
                await asyncio.sleep(wait_time)
        self._request_times.append(time.time())

    async def complete(
        self,
        prompt: str,
        *,
        system_prompt: str = "",
        model: str = "claude-sonnet-4-20250514",
        max_tokens: int = 4096,
    ) -> AIResponse | None:
        """Send a completion request to Claude. Returns None on any failure."""
        client = self._get_client()
        if client is None:
            logger.warning("AI client not available (no API key or init failed)")
            return None

        await self._wait_for_rate_limit()

        messages = [{"role": "user", "content": prompt}]
        kwargs = {"model": model, "max_tokens": max_tokens, "messages": messages}
        if system_prompt:
            kwargs["system"] = system_prompt

        for attempt in range(3):
            try:
                response = await asyncio.to_thread(client.messages.create, **kwargs)

                usage = TokenUsage(
                    input_tokens=response.usage.input_tokens,
                    output_tokens=response.usage.output_tokens,
                    model=model,
                    cost=(
                        Decimal(response.usage.input_tokens) * INPUT_COST_PER_TOKEN
                        + Decimal(response.usage.output_tokens) * OUTPUT_COST_PER_TOKEN
                    ),
                )

                self._total_input_tokens += usage.input_tokens
                self._total_output_tokens += usage.output_tokens
                self._total_cost += usage.cost
                self._request_count += 1

                logger.info(
                    "AI request completed",
                    extra={
                        "model": model,
                        "input_tokens": usage.input_tokens,
                        "output_tokens": usage.output_tokens,
                        "cost": str(usage.cost),
                        "total_cost": str(self._total_cost),
                    },
                )

                content = response.content[0].text if response.content else ""
                return AIResponse(content=content, usage=usage, success=True)

            except Exception as e:
                delay = 2**attempt  # 1s, 2s, 4s
                logger.warning(
                    f"AI request failed (attempt {attempt + 1}/3): {e}",
                    extra={"delay": delay},
                )
                if attempt < 2:
                    await asyncio.sleep(delay)

        logger.error("AI request failed after 3 attempts")
        return None

    @property
    def stats(self) -> dict:
        return {
            "request_count": self._request_count,
            "total_input_tokens": self._total_input_tokens,
            "total_output_tokens": self._total_output_tokens,
            "total_cost": str(self._total_cost),
        }


# Singleton
ai_client = AIClient()
