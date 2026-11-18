import runpy
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "redact_fixtures.py"
module = runpy.run_path(str(SCRIPT))


def test_replaces_identifiers_inside_strings_and_keys():
    raw = {
        "url": "https://api.robinhood.com/accounts/5QR123/positions/",
        "5QR123": {"label": "Agentic 5QR123"},
        "account_number": "5QR123",
        "symbol": "AAPL",
    }
    cleaned = module["clean"](raw, {"5QR123": "FAKE001"}, "FAKE001")
    assert "5QR123" not in repr(cleaned)
    assert cleaned == {
        "url": "https://api.robinhood.com/accounts/FAKE001/positions/",
        "FAKE001": {"label": "Agentic FAKE001"},
        "account_number": "FAKE001",
        "symbol": "AAPL",
    }


def test_redacts_tokens_but_keeps_account_fields():
    cleaned = module["clean"]({"access_token": "t", "rhs_account_number": "FAKE001"}, {}, "FAKE001")
    assert cleaned == {"access_token": "[REDACTED]", "rhs_account_number": "FAKE001"}


def test_other_accounts_keep_only_allowlisted_fields():
    raw = {
        "accounts": [
            {"account_number": "REAL1", "agentic_allowed": True, "unsettled_funds": "5.00", "nickname": "MCP"},
            {"account_number": "REAL2", "agentic_allowed": False, "unsettled_funds": "123.45", "balance": "9"},
        ]
    }
    cleaned = module["clean"](raw, {"REAL1": "FAKE001", "REAL2": "FAKE002"}, "FAKE001")
    assert cleaned["accounts"] == [
        {"account_number": "FAKE001", "agentic_allowed": True, "unsettled_funds": "5.00", "nickname": "MCP"},
        {"account_number": "FAKE002", "agentic_allowed": False},
    ]


def test_refuses_to_run_without_the_agentic_id(monkeypatch, capsys):
    monkeypatch.setenv("RH_SCRUB", "REAL1=FAKE001")
    monkeypatch.setenv("RH_AGENTIC", "FAKE999")
    assert module["main"]() == 1
    assert "RH_AGENTIC" in capsys.readouterr().err


def test_rejects_entries_without_a_fake():
    with pytest.raises(ValueError):
        module["parse_replacements"]("5QR123")


def test_refuses_to_run_without_identifiers(monkeypatch, capsys):
    monkeypatch.delenv("RH_SCRUB", raising=False)
    assert module["main"]() == 1
    assert "RH_SCRUB" in capsys.readouterr().err
