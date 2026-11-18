"""Write sample public_* documents to the local Firestore emulator.

Usage, from the repo root with the emulator running (npm run emulators):
    FIRESTORE_EMULATOR_HOST=localhost:8080 trading/.venv/bin/python trading/scripts/seed_public.py
"""

import os
import sys
from datetime import date, datetime, timedelta, timezone

from google.cloud import firestore

PROJECT_ID = "angelnivar-portfolio"


def sample_documents(now: datetime) -> list[tuple[str, dict]]:
    docs = [
        (
            "public_snapshot/current",
            {
                "updated_at": now,
                "equity_usd": 15.42,
                "cash_usd": 4.92,
                "buying_power_usd": 4.92,
                "day_change_usd": -0.08,
                "total_return_usd": 0.42,
                "total_return_pct": 2.8,
                "positions": [
                    {
                        "symbol": "AAPL",
                        "quantity": 0.025,
                        "avg_cost_usd": 200.0,
                        "market_value_usd": 5.25,
                        "unrealized_pl_usd": 0.25,
                        "unrealized_pl_pct": 5.0,
                    },
                    {
                        "symbol": "MSFT",
                        "quantity": 0.0128,
                        "avg_cost_usd": 410.0,
                        "market_value_usd": 5.25,
                        "unrealized_pl_usd": 0.0,
                        "unrealized_pl_pct": 0.0,
                    },
                ],
            },
        ),
        (
            "public_trades/sample-1",
            {
                "symbol": "AAPL",
                "side": "buy",
                "order_type": "market",
                "notional_usd": 5.0,
                "quantity": 0.025,
                "avg_fill_price_usd": 200.0,
                "state": "filled",
                "submitted_at": now - timedelta(days=2),
                "updated_at": now - timedelta(days=2),
                "filled_at": now - timedelta(days=2),
                "run_id": "sample-run-1",
            },
        ),
        (
            "public_trades/sample-2",
            {
                "symbol": "MSFT",
                "side": "buy",
                "order_type": "market",
                "notional_usd": 5.25,
                "quantity": 0.0128,
                "avg_fill_price_usd": 410.0,
                "state": "filled",
                "submitted_at": now - timedelta(days=1),
                "updated_at": now - timedelta(days=1),
                "filled_at": now - timedelta(days=1),
                "run_id": "sample-run-2",
            },
        ),
        (
            "public_runs/sample-run-2",
            {
                "started_at": now - timedelta(hours=1),
                "status": "ok",
                "actions": [],
                "rationale": "Sample data: no trade, positions are within target weights.",
                "model": "sonnet",
            },
        ),
    ]
    today = date.today()
    for days_ago, equity in enumerate([15.42, 15.5, 15.21, 15.1, 15.0]):
        day = (today - timedelta(days=days_ago)).isoformat()
        docs.append((f"public_equity_history/{day}", {"date": day, "equity_usd": equity, "updated_at": now}))
    return docs


def main() -> int:
    if not os.environ.get("FIRESTORE_EMULATOR_HOST"):
        print("Refusing to run: FIRESTORE_EMULATOR_HOST is not set, so this would write to production.", file=sys.stderr)
        return 1
    db = firestore.Client(project=PROJECT_ID)
    batch = db.batch()
    for path, data in sample_documents(datetime.now(timezone.utc)):
        batch.set(db.document(path), data)
    batch.commit()
    print(f"Seeded the emulator at {os.environ['FIRESTORE_EMULATOR_HOST']}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
