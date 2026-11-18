import json

from lib import store


def test_truncate_keeps_values_within_the_limit():
    assert store.truncate({"a": 1}, 100) == ({"a": 1}, False)


def test_truncate_cuts_oversized_values_to_the_limit():
    value, cut = store.truncate({"text": "x" * 1000}, 100)
    assert cut is True
    assert isinstance(value, str)
    assert len(value.encode()) <= 100


def test_truncate_does_not_split_multibyte_characters():
    value, cut = store.truncate("é" * 100, 51)
    assert cut is True
    value.encode("utf-8")
    assert "�" not in value


def test_truncate_drops_a_character_cut_in_half_by_the_limit():
    # The opening JSON quote takes one byte, so 52 bytes ends inside the 26th two-byte character.
    value, cut = store.truncate("é" * 100, 52)
    assert cut is True
    assert value == '"' + "é" * 25


def test_run_id_is_none_outside_a_scheduled_run(monkeypatch):
    monkeypatch.delenv("RUN_ID", raising=False)
    assert store.run_id() is None
    monkeypatch.setenv("RUN_ID", "20261118-abc")
    assert store.run_id() == "20261118-abc"


def test_firestore_safe_keeps_storable_maps():
    value = {"a": [{"b": 1}, 2], "c": {"d": None}}
    assert store.firestore_safe(value) is value


def test_firestore_safe_serialises_what_firestore_rejects():
    for value in ({"a": [[1, 2]]}, {"": 1}, {"__name__": 1}):
        assert json.loads(store.firestore_safe(value)) == value


def test_firestore_safe_serialises_excessive_depth():
    value = current = {}
    for _ in range(store.MAX_FIRESTORE_DEPTH + 2):
        current["n"] = {}
        current = current["n"]
    assert isinstance(store.firestore_safe(value), str)
