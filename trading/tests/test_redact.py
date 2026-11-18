import re

from lib.redact import REDACTED, redact


def test_redacts_sensitive_keys_at_any_depth():
    raw = {
        "access_token": "abc",
        "Authorization": "Bearer abc",
        "results": [{"account_number": "5QR1", "accountId": "x", "symbol": "AAPL"}],
        "owner": {"ssn": "123", "client_secret": "s"},
    }
    assert redact(raw) == {
        "access_token": REDACTED,
        "Authorization": REDACTED,
        "results": [{"account_number": REDACTED, "accountId": "x", "symbol": "AAPL"}],
        "owner": {"ssn": REDACTED, "client_secret": REDACTED},
    }


def test_redacts_case_insensitively():
    assert redact({"ACCOUNT_ID": "1", "Refresh_Token": "t"}) == {"ACCOUNT_ID": REDACTED, "Refresh_Token": REDACTED}


def test_leaves_other_values_and_the_input_unchanged():
    raw = {"symbol": "AAPL", "price": 1.5, "nested": [{"token_count": 3}], "flag": None}
    assert redact(raw) == {"symbol": "AAPL", "price": 1.5, "nested": [{"token_count": REDACTED}], "flag": None}
    assert raw["nested"][0]["token_count"] == 3


def test_passes_scalars_through():
    assert redact("text") == "text"
    assert redact(7) == 7
    assert redact(None) is None


def test_accepts_a_custom_key_pattern():
    assert redact({"account_number": "1", "access_token": "t"}, re.compile("token")) == {
        "account_number": "1",
        "access_token": REDACTED,
    }
