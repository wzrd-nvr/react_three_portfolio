import io
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from hooks import log_tool_call as hook
from lib import session_state

TRADING = Path(__file__).resolve().parents[1]
FIXTURES = TRADING / "fixtures"
ACCOUNT = "900000001"


class FakeDocument:
    def __init__(self, db, path):
        self.db, self.path = db, path

    def set(self, data, merge=False, retry=None, timeout=None):
        if self.db.fail:
            raise RuntimeError("firestore down")
        self.db.writes[self.path] = {"data": data, "merge": merge, "timeout": timeout}


class FakeCollection:
    def __init__(self, db, name):
        self.db, self.name = db, name

    def document(self, doc_id):
        return FakeDocument(self.db, f"{self.name}/{doc_id}")


class FakeDb:
    def __init__(self, fail=False):
        self.writes, self.fail = {}, fail

    def collection(self, name):
        return FakeCollection(self, name)


@pytest.fixture(autouse=True)
def state_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(session_state, "STATE_DIR", tmp_path)
    monkeypatch.delenv("RUN_ID", raising=False)
    return tmp_path


def fixture_text(name):
    return (FIXTURES / f"{name}.json").read_text()


def event(tool="get_equity_quotes", name="PostToolUse", **overrides):
    return {
        "session_id": "s1",
        "hook_event_name": name,
        "tool_name": f"mcp__robinhood__{tool}",
        "tool_input": {"symbols": ["AAPL"]},
        "tool_use_id": "toolu_1",
        "duration_ms": 118,
        **overrides,
    }


def run(payload, db=None):
    db = db or FakeDb()
    assert hook.main(io.StringIO(json.dumps(payload)), lambda: db) == 0
    return db


def logged(db):
    return db.writes["mcp_logs/toolu_1"]["data"]


def test_success_writes_the_documented_log_fields():
    db = run(event(tool_response=fixture_text("get_equity_quotes")))
    entry = logged(db)
    assert set(entry) == {
        "run_id", "session_id", "ts", "event", "tool_name", "deny_reason",
        "tool_input", "tool_response", "truncated", "duration_ms",
    }  # fmt: skip
    assert entry["event"] == "PostToolUse"
    assert entry["duration_ms"] == 118
    assert entry["truncated"] is False
    assert entry["tool_response"]["data"]["results"][0]["quote"]["symbol"] == "AAPL"
    assert db.writes["mcp_logs/toolu_1"]["timeout"] == hook.FIRESTORE_TIMEOUT_SECONDS


def test_json_string_responses_are_redacted_by_key():
    response = json.dumps({"data": {"accounts": [{"account_number": ACCOUNT, "rhs_account_number": ACCOUNT}]}})
    db = run(event("get_accounts", tool_input={}, tool_response=response))
    assert ACCOUNT not in json.dumps(logged(db)["tool_response"])


def test_account_number_is_removed_from_input_error_and_free_text():
    response = json.dumps({"data": {"note": f"see /accounts/{ACCOUNT}/positions"}})
    db = run(event("get_portfolio", tool_input={"account_number": ACCOUNT}, tool_response=response))
    assert ACCOUNT not in json.dumps(logged(db), default=str)

    failure = event(
        "get_portfolio", "PostToolUseFailure",
        tool_input={"account_number": ACCOUNT}, error=f"account {ACCOUNT}: API error 401",
    )  # fmt: skip
    entry = logged(run(failure))
    assert entry["event"] == "PostToolUseFailure"
    assert entry["tool_response"] == "account [REDACTED]: API error 401"


def test_account_number_is_removed_from_free_text_in_the_input():
    tool_input = {"account_number": ACCOUNT, "note": f"orders for {ACCOUNT}"}
    entry = logged(run(event("get_portfolio", tool_input=tool_input, tool_response="{}")))
    assert entry["tool_input"]["note"] == "orders for [REDACTED]"


OTHER_ACCOUNT = "900000002"


@pytest.mark.parametrize(
    "overrides",
    [
        {"tool_input": {"account_number": ACCOUNT}, "tool_response": json.dumps({"note": f"see {OTHER_ACCOUNT}."})},
        {"tool_input": {}, "tool_response": json.dumps({"ref": OTHER_ACCOUNT})},
        {"tool_input": {}, "tool_response": f'{{"account_number":"{OTHER_ACCOUNT}"'},
        {"tool_input": {"account_number": int(ACCOUNT)}, "tool_response": json.dumps({"note": f"acct {ACCOUNT}"})},
        {"tool_input": {"note": f"acct {OTHER_ACCOUNT}"}, "tool_response": "{}"},
        {"tool_input": {}, "tool_response": json.dumps({OTHER_ACCOUNT: "keyed by account"})},
    ],
)
def test_account_like_numbers_are_removed_from_success_logs(overrides):
    entry = logged(run(event("get_portfolio", **overrides)))
    text = json.dumps(entry, default=str)
    assert ACCOUNT not in text
    assert OTHER_ACCOUNT not in text


@pytest.mark.parametrize("account", ["ACCT1234", 12345678])
def test_the_input_account_is_removed_even_in_an_unusual_format(account):
    response = json.dumps({"note": f"acct {account}"})
    entry = logged(run(event("get_portfolio", tool_input={"account_number": account}, tool_response=response)))
    assert entry["tool_response"]["note"] == "acct [REDACTED]"


def test_account_like_numbers_are_removed_from_errors_without_account_input():
    entry = logged(run(event("get_portfolio", "PostToolUseFailure", tool_input={}, error=f"account {ACCOUNT}: 401")))
    assert entry["tool_response"] == "account [REDACTED]: 401"


def test_account_like_numbers_are_removed_from_deny_reasons():
    entry = logged(run(event("place_equity_order", "PermissionDenied", tool_input={}, reason=f"blocked {ACCOUNT}")))
    assert entry["deny_reason"] == "blocked [REDACTED]"


@pytest.mark.parametrize(
    "value",
    ["3400000000.00", "351.880000", "12345678", "1795019133861", "2026-11-18T20:03:45.447320123Z"],
)
def test_market_data_is_not_mistaken_for_an_account_number(value):
    entry = logged(run(event(tool_response=json.dumps({"data": {"value": value}}))))
    assert entry["tool_response"]["data"]["value"] == value


def test_permission_denied_records_the_reason():
    entry = logged(run(event("place_equity_order", "PermissionDenied", reason="not allowed")))
    assert entry["event"] == "PermissionDenied"
    assert entry["deny_reason"] == "not allowed"
    assert entry["tool_response"] is None


def test_oversized_responses_are_truncated(monkeypatch):
    monkeypatch.setattr(hook, "MAX_TOOL_RESPONSE_BYTES", 200)
    entry = logged(run(event(tool_response=json.dumps({"data": "x" * 5000}))))
    assert entry["truncated"] is True
    assert len(entry["tool_response"].encode()) <= 200


def test_quote_capture_prefers_the_ask():
    run(event(tool_response=fixture_text("get_equity_quotes")))
    quote = session_state.load("s1")["quotes"]["AAPL"]
    assert quote["price"] == "350.440000"
    assert quote["ts"]


def quote_response(**quote):
    return json.dumps({"data": {"results": [{"quote": {"symbol": "AAPL", "state": "active", **quote}}]}})


def test_quote_capture_falls_back_to_last_trade_when_the_ask_is_zero():
    run(event(tool_response=quote_response(ask_price="0.000000", last_trade_price="351.90")))
    assert session_state.load("s1")["quotes"]["AAPL"]["price"] == "351.90"


@pytest.mark.parametrize(
    "quote",
    [
        {"state": "halted", "ask_price": "10.00"},
        {"ask_price": "0", "last_trade_price": "0"},
        {"ask_price": "NaN", "last_trade_price": None},
        {"ask_price": "-1"},
    ],
)
def test_quote_capture_skips_unusable_quotes(quote):
    run(event(tool_response=quote_response(**quote)))
    assert session_state.load("s1") == {}


def review_input():
    return {
        "account_number": ACCOUNT, "symbol": "AAPL", "side": "buy", "type": "market",
        "dollar_amount": "1.00", "time_in_force": "gfd",
    }  # fmt: skip


def test_review_capture_records_the_order_without_the_account():
    run(event("review_equity_order", tool_input=review_input(),
              tool_response=fixture_text("review_equity_order_market_dollar")))  # fmt: skip
    [review] = session_state.load("s1")["reviews"]
    assert review["symbol"] == "AAPL"
    assert review["dollar_amount"] == "1.00"
    assert review["order_checks_clear"] is True
    assert "account_number" not in review


def test_review_with_broker_alerts_is_marked_not_clear():
    run(event("review_equity_order", tool_input=review_input(),
              tool_response=fixture_text("review_equity_order_limit_shares")))  # fmt: skip
    assert session_state.load("s1")["reviews"][0]["order_checks_clear"] is False


def test_failed_review_is_not_captured():
    run(event("review_equity_order", "PostToolUseFailure", tool_input=review_input(), error="rejected"))
    assert session_state.load("s1") == {}


@pytest.mark.parametrize("name", ["PostToolUseFailure", "PermissionDenied"])
def test_only_successful_calls_update_session_state(name):
    run(event(name=name, tool_response=fixture_text("get_equity_quotes")))
    assert session_state.load("s1") == {}


def test_rh_ok_is_set_only_for_successes_in_a_run(monkeypatch):
    assert "runs/r1" not in run(event(tool_response="{}")).writes
    monkeypatch.setenv("RUN_ID", "r1")
    db = run(event(tool_response="{}"))
    assert db.writes["runs/r1"]["data"] == {"rh_ok": True}
    assert db.writes["runs/r1"]["merge"] is True
    assert "runs/r1" not in run(event(name="PostToolUseFailure", error="boom")).writes


def test_other_tools_are_ignored():
    db = run({**event(), "tool_name": "Bash"})
    assert db.writes == {}


def test_firestore_failure_exits_zero_keeps_state_and_logs_the_error(state_dir):
    run(event(tool_response=fixture_text("get_equity_quotes")), FakeDb(fail=True))
    assert "AAPL" in session_state.load("s1")["quotes"]
    assert "write mcp_logs" in (state_dir / hook.ERROR_LOG).read_text()


def test_client_failure_exits_zero_and_logs_the_error(state_dir):
    def broken():
        raise RuntimeError("no credentials")

    assert hook.main(io.StringIO(json.dumps(event(tool_response="{}"))), broken) == 0
    assert "create Firestore client" in (state_dir / hook.ERROR_LOG).read_text()


def test_script_exits_zero_on_malformed_input(tmp_path):
    result = subprocess.run(
        [sys.executable, str(TRADING / "hooks" / "log_tool_call.py")],
        input="not json", capture_output=True, text=True, timeout=30, check=False,
        env={**os.environ, "TRADING_STATE_DIR": str(tmp_path)},
    )  # fmt: skip
    assert result.returncode == 0
    assert "read hook input" in (tmp_path / hook.ERROR_LOG).read_text()
