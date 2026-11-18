from datetime import datetime


def notional(tool_input: dict, quotes: dict, now: datetime) -> float | None:
    raise NotImplementedError


def review_matches(tool_input: dict, reviews: list[dict]) -> bool:
    raise NotImplementedError


def account_ok(tool_input: dict, agentic_account: str) -> bool:
    raise NotImplementedError
