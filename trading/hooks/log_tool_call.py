import json
import re
import sys
import traceback
from collections.abc import Callable
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from lib import fields, session_state, store
from lib.redact import REDACTED, redact, redact_text

ERROR_LOG = "hook_errors.log"
FIRESTORE_TIMEOUT_SECONDS = 10
MAX_TOOL_INPUT_BYTES = 50_000
MAX_TOOL_RESPONSE_BYTES = 800_000
# Robinhood account numbers are 9 or 12 digits. The lookarounds spare both sides of
# a decimal, such as a volume of 3400000000.00 or fractional seconds in a timestamp.
ACCOUNT_LIKE = re.compile(r"(?<!\d)(?<!\d\.)\d{9,12}(?!\d)(?!\.\d)")


def record_error(step: str) -> None:
    try:
        session_state.STATE_DIR.mkdir(parents=True, exist_ok=True)
        with open(session_state.STATE_DIR / ERROR_LOG, "a") as log:
            log.write(f"{datetime.now(UTC).isoformat()} {step}\n{traceback.format_exc()}\n")
    except Exception:
        pass


def dig(value: Any, path: tuple[str, ...]) -> Any:
    for key in path:
        value = value.get(key) if isinstance(value, dict) else None
    return value


def positive_price(text: Any) -> str | None:
    try:
        price = Decimal(str(text))
    except InvalidOperation:
        return None
    return str(text) if price.is_finite() and price > 0 else None


def captured_quotes(payload: Any, now: datetime) -> dict[str, dict]:
    quotes = {}
    results = dig(payload, fields.QUOTE_RESULTS)
    for result in results if isinstance(results, list) else []:
        quote = dig(result, (fields.QUOTE,))
        symbol = dig(quote, (fields.QUOTE_SYMBOL,))
        if not symbol or dig(quote, (fields.QUOTE_STATE,)) != fields.QUOTE_STATE_ACTIVE:
            continue
        price = positive_price(quote.get(fields.QUOTE_ASK)) or positive_price(quote.get(fields.QUOTE_LAST_TRADE))
        if price:
            quotes[symbol] = {"price": price, "ts": now.isoformat()}
    return quotes


def captured_review(tool_input: dict, payload: Any, now: datetime) -> dict | None:
    data = dig(payload, fields.REVIEW_DATA)
    if not isinstance(data, dict):
        return None
    review = {key: tool_input[key] for key in fields.ORDER_INPUT_FIELDS if key in tool_input}
    review["order_checks_clear"] = data.get(fields.REVIEW_ORDER_CHECKS) == {}
    review["ts"] = now.isoformat()
    return review


def update_session_state(event: dict, now: datetime) -> None:
    if event.get("hook_event_name") != "PostToolUse":
        return
    tool = event["tool_name"].removeprefix(fields.TOOL_PREFIX)
    payload = fields.response_payload(event.get("tool_response"))
    if tool == fields.TOOL_QUOTES:
        quotes = captured_quotes(payload, now)
        if quotes:
            session_state.update(event["session_id"], lambda s: s.setdefault("quotes", {}).update(quotes))
    elif tool == fields.TOOL_REVIEW:
        review = captured_review(event.get("tool_input") or {}, payload, now)
        if review:
            session_state.update(event["session_id"], lambda s: s.setdefault("reviews", []).append(review))


def mask_text(text: str, secret: str | None) -> str:
    text = redact_text(text)
    if secret:
        text = text.replace(secret, REDACTED)
    return ACCOUNT_LIKE.sub(REDACTED, text)


def mask(value: Any, secret: str | None) -> Any:
    if isinstance(value, dict):
        return {mask(key, secret): mask(item, secret) for key, item in value.items()}
    if isinstance(value, list):
        return [mask(item, secret) for item in value]
    if isinstance(value, int) and not isinstance(value, bool):
        return REDACTED if mask_text(str(value), secret) != str(value) else value
    return mask_text(value, secret) if isinstance(value, str) else value


def account_text(account: Any) -> str | None:
    return str(account) if isinstance(account, (str, int)) and not isinstance(account, bool) else None


def log_entry(event: dict, now: datetime) -> dict:
    name = event["hook_event_name"]
    tool_input = event.get("tool_input") or {}
    account = account_text(tool_input.get(fields.ACCOUNT_PARAM))
    result = event.get("error") if name == "PostToolUseFailure" else event.get("tool_response")
    clean_input, input_cut = store.truncate(mask(redact(tool_input), account), MAX_TOOL_INPUT_BYTES)
    clean_result, result_cut = store.truncate(
        mask(redact(fields.response_payload(result)), account), MAX_TOOL_RESPONSE_BYTES
    )
    return {
        "run_id": store.run_id(),
        "session_id": event.get("session_id"),
        "ts": now,
        "event": name,
        "tool_name": event["tool_name"],
        "deny_reason": mask(event.get("reason"), account),
        "tool_input": store.firestore_safe(clean_input),
        "tool_response": store.firestore_safe(clean_result),
        "truncated": input_cut or result_cut,
        "duration_ms": event.get("duration_ms"),
    }


def write_log(db: Any, event: dict, now: datetime) -> None:
    db.collection("mcp_logs").document(event["tool_use_id"]).set(
        log_entry(event, now), retry=None, timeout=FIRESTORE_TIMEOUT_SECONDS
    )


def mark_robinhood_ok(db: Any, event: dict) -> None:
    run = store.run_id()
    if run and event.get("hook_event_name") == "PostToolUse":
        db.collection("runs").document(run).set(
            {"rh_ok": True}, merge=True, retry=None, timeout=FIRESTORE_TIMEOUT_SECONDS
        )


def main(stdin: Any = None, make_client: Callable[[], Any] = store.client) -> int:
    try:
        event = json.load(stdin or sys.stdin)
        if not event["tool_name"].startswith(fields.TOOL_PREFIX):
            return 0
    except Exception:
        record_error("read hook input")
        return 0

    now = datetime.now(UTC)
    # Local state comes first: the guard needs it even when Firestore is slow or down.
    try:
        update_session_state(event, now)
    except Exception:
        record_error("update session state")
    try:
        db = make_client()
    except Exception:
        record_error("create Firestore client")
        return 0
    try:
        write_log(db, event, now)
    except Exception:
        record_error("write mcp_logs")
    try:
        mark_robinhood_ok(db, event)
    except Exception:
        record_error("mark rh_ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
