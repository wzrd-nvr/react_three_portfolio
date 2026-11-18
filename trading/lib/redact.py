import re
from typing import Any

SENSITIVE_KEY = re.compile(r"token|secret|authorization|account_number|account_id|ssn", re.IGNORECASE)
REDACTED = "[REDACTED]"
# Matches key=value and key: value pairs in raw text, including cut-off and escaped JSON.
# The key suffix is bounded so that long unbroken text cannot make the scan quadratic.
SENSITIVE_PAIR = re.compile(
    rf"""
    ((?:{SENSITIVE_KEY.pattern})[\w-]{{0,64}}\\*["']?\s*[:=]\s*)
    (?:
        \\"(?:(?!\\").)*(?:\\")?
        | "(?:[^"\\]|\\.)*"?
        | '(?:[^'\\]|\\.)*'?
        | (?:[A-Za-z][\w-]*[ \t]+)?[^\s,;&}}\]]+
    )
    """,
    re.IGNORECASE | re.VERBOSE | re.DOTALL,
)


def redact_text(text: str) -> str:
    return SENSITIVE_PAIR.sub(lambda match: f"{match[1]}{REDACTED}", text)


def redact(value: Any, pattern: re.Pattern = SENSITIVE_KEY) -> Any:
    if isinstance(value, dict):
        return {
            key: REDACTED if isinstance(key, str) and pattern.search(key) else redact(item, pattern)
            for key, item in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [redact(item, pattern) for item in value]
    return value
