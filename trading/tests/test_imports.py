import importlib

import pytest

MODULES = [
    "lib.store",
    "lib.redact",
    "lib.session_state",
    "lib.fields",
    "lib.market_hours",
    "lib.limits",
    "lib.order_counter",
    "lib.projectors",
    "lib.preflight",
    "lib.postflight",
    "hooks.guard",
    "hooks.log_tool_call",
]


@pytest.mark.parametrize("name", MODULES)
def test_module_imports(name):
    importlib.import_module(name)


def test_runtime_dependencies_import():
    importlib.import_module("google.cloud.firestore")
    importlib.import_module("exchange_calendars")
