from typing import Any


def client():
    raise NotImplementedError


def run_id() -> str:
    raise NotImplementedError


def truncate(value: Any, max_bytes: int) -> tuple[Any, bool]:
    raise NotImplementedError
