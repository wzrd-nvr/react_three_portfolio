import re
from typing import Any

SENSITIVE_KEY = re.compile(r"token|secret|authorization|account_number|account_id|ssn", re.IGNORECASE)
REDACTED = "[REDACTED]"


def redact(value: Any, pattern: re.Pattern = SENSITIVE_KEY) -> Any:
    if isinstance(value, dict):
        return {
            key: REDACTED if isinstance(key, str) and pattern.search(key) else redact(item, pattern)
            for key, item in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [redact(item, pattern) for item in value]
    return value
