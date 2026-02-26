from dataclasses import dataclass, field
from decimal import Decimal


@dataclass
class TokenUsage:
    input_tokens: int = 0
    output_tokens: int = 0
    model: str = ""
    cost: Decimal = Decimal("0")


@dataclass
class AIResponse:
    content: str = ""
    usage: TokenUsage = field(default_factory=TokenUsage)
    success: bool = True
