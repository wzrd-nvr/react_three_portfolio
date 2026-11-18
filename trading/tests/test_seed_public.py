import runpy
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "seed_public.py"


def test_refuses_to_run_without_the_emulator(monkeypatch, capsys):
    monkeypatch.delenv("FIRESTORE_EMULATOR_HOST", raising=False)
    module = runpy.run_path(str(SCRIPT))
    assert module["main"]() == 1
    assert "production" in capsys.readouterr().err


def test_sample_documents_only_target_public_collections():
    from datetime import datetime, timezone

    module = runpy.run_path(str(SCRIPT))
    paths = [path for path, _ in module["sample_documents"](datetime.now(timezone.utc))]
    assert paths
    assert all(path.split("/")[0].startswith("public_") for path in paths)
