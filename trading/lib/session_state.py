import fcntl
import json
import os
import re
import tempfile
from collections.abc import Callable
from pathlib import Path

STATE_DIR = Path(os.environ.get("TRADING_STATE_DIR", Path(__file__).resolve().parents[1] / ".state"))
SAFE_SESSION_ID = re.compile(r"^[A-Za-z0-9_-]+$")


def _path(session_id: str, suffix: str) -> Path:
    if not SAFE_SESSION_ID.match(session_id):
        raise ValueError("unsafe session id")
    return STATE_DIR / f"{session_id}{suffix}"


def load(session_id: str) -> dict:
    try:
        return json.loads(_path(session_id, ".json").read_text())
    except FileNotFoundError:
        return {}


def save(session_id: str, state: dict) -> None:
    target = _path(session_id, ".json")
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(dir=STATE_DIR, prefix=".tmp-")
    try:
        with os.fdopen(fd, "w") as temp:
            json.dump(state, temp)
            temp.flush()
            os.fsync(temp.fileno())
        os.replace(temp_name, target)
    except BaseException:
        Path(temp_name).unlink(missing_ok=True)
        raise


def update(session_id: str, mutate: Callable[[dict], None]) -> None:
    """Apply mutate under a lock, because Claude can run tool hooks in parallel."""
    lock_path = _path(session_id, ".lock")
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with open(lock_path, "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        state = load(session_id)
        mutate(state)
        save(session_id, state)
