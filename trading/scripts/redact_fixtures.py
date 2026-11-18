"""Write redacted copies of raw Robinhood MCP responses for committing.

Usage, from trading/:
    RH_SCRUB="<real id>=<fake id>,<real id>=<fake id>" .venv/bin/python scripts/redact_fixtures.py

Reads fixtures/raw/*.json (gitignored) and writes fixtures/<name>.json. Every
real identifier is replaced by its fake wherever it appears inside a string or
key, because account numbers also show up in URLs and unexpected fields.
Account fields keep their (fake) values so projector tests can tell the
Agentic account from the others; other sensitive keys are redacted. Review
every output by hand before committing.
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from lib.redact import redact

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"
NON_ACCOUNT_SECRETS = re.compile(r"token|secret|authorization|ssn", re.IGNORECASE)


def parse_replacements(spec: str) -> dict[str, str]:
    replacements = {}
    for pair in spec.split(","):
        real, sep, fake = pair.partition("=")
        if not sep or not real.strip() or not fake.strip():
            raise ValueError("RH_SCRUB entries must look like real=fake")
        replacements[real.strip()] = fake.strip()
    return replacements


def scrub(value: Any, replacements: dict[str, str]) -> Any:
    if isinstance(value, dict):
        return {scrub(key, replacements): scrub(item, replacements) for key, item in value.items()}
    if isinstance(value, list):
        return [scrub(item, replacements) for item in value]
    if isinstance(value, str):
        for real, fake in replacements.items():
            value = value.replace(real, fake)
    return value


def clean(raw: Any, replacements: dict[str, str]) -> Any:
    return redact(scrub(raw, replacements), NON_ACCOUNT_SECRETS)


def main() -> int:
    spec = os.environ.get("RH_SCRUB", "").strip()
    if not spec:
        print("Set RH_SCRUB to real=fake pairs for every account identifier.", file=sys.stderr)
        return 1
    replacements = parse_replacements(spec)
    raw_files = sorted((FIXTURES / "raw").glob("*.json"))
    if not raw_files:
        print("No files in fixtures/raw/.", file=sys.stderr)
        return 1
    for path in raw_files:
        text = json.dumps(clean(json.loads(path.read_text()), replacements), indent=2, sort_keys=True) + "\n"
        if any(real in text for real in replacements):
            print(f"{path.name}: identifier survived redaction; not written.", file=sys.stderr)
            return 1
        (FIXTURES / path.name).write_text(text)
        print(f"wrote fixtures/{path.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
