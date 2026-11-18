import json
import os
import re
from typing import Any

PROJECT_ID = "angelnivar-portfolio"
MAX_FIRESTORE_DEPTH = 20
RESERVED_FIELD = re.compile(r"^__.*__$")


def client():
    from google.cloud import firestore

    return firestore.Client(project=PROJECT_ID)


def run_id() -> str | None:
    return os.environ.get("RUN_ID") or None


def truncate(value: Any, max_bytes: int) -> tuple[Any, bool]:
    encoded = json.dumps(value, default=str, ensure_ascii=False).encode("utf-8", "replace")
    if len(encoded) <= max_bytes:
        return value, False
    return encoded[:max_bytes].decode("utf-8", "ignore"), True


def _storable(value: Any, depth: int = 0, in_list: bool = False) -> bool:
    if depth > MAX_FIRESTORE_DEPTH:
        return False
    if isinstance(value, dict):
        return all(
            isinstance(key, str) and key and not RESERVED_FIELD.match(key) and _storable(item, depth + 1)
            for key, item in value.items()
        )
    if isinstance(value, (list, tuple)):
        return not in_list and all(_storable(item, depth + 1, in_list=True) for item in value)
    return True


def firestore_safe(value: Any) -> Any:
    """Return value unchanged if Firestore can store it, otherwise its JSON text."""
    return value if _storable(value) else json.dumps(value, default=str, ensure_ascii=False)
