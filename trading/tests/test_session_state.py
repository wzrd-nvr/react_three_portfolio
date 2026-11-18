import stat
import threading

import pytest

from lib import session_state


@pytest.fixture(autouse=True)
def state_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(session_state, "STATE_DIR", tmp_path / ".state")
    return tmp_path / ".state"


def test_missing_session_loads_empty():
    assert session_state.load("abc") == {}


def test_save_then_load_round_trips(state_dir):
    session_state.save("abc", {"quotes": {"AAPL": {"price": "1.00"}}})
    assert session_state.load("abc") == {"quotes": {"AAPL": {"price": "1.00"}}}
    assert stat.S_IMODE((state_dir / "abc.json").stat().st_mode) == 0o600


def test_failed_save_keeps_the_previous_state_and_no_temp_file(state_dir):
    session_state.save("abc", {"ok": True})
    with pytest.raises(TypeError):
        session_state.save("abc", {"bad": object()})
    assert session_state.load("abc") == {"ok": True}
    assert not list(state_dir.glob(".tmp-*"))


def test_corrupt_state_raises_instead_of_reading_as_empty(state_dir):
    state_dir.mkdir()
    (state_dir / "abc.json").write_text("{not json")
    with pytest.raises(ValueError):
        session_state.load("abc")


@pytest.mark.parametrize("content", ["[]", '"text"', "7", "null", "true"])
def test_state_that_is_not_an_object_raises(state_dir, content):
    state_dir.mkdir()
    (state_dir / "abc.json").write_text(content)
    with pytest.raises(ValueError):
        session_state.load("abc")


def test_update_leaves_state_that_is_not_an_object_untouched(state_dir):
    state_dir.mkdir()
    (state_dir / "abc.json").write_text("[]")
    with pytest.raises(ValueError):
        session_state.update("abc", lambda state: state.setdefault("quotes", {}))
    assert (state_dir / "abc.json").read_text() == "[]"


@pytest.mark.parametrize("session_id", ["../../etc/passwd", "a/b", "", "a b"])
def test_rejects_unsafe_session_ids(session_id):
    with pytest.raises(ValueError):
        session_state.load(session_id)


def test_parallel_updates_are_not_lost():
    def add(n):
        session_state.update("abc", lambda state: state.setdefault("quotes", {}).update({str(n): n}))

    threads = [threading.Thread(target=add, args=(n,)) for n in range(25)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    assert len(session_state.load("abc")["quotes"]) == 25
