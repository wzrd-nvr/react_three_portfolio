# Robinhood request/response field names, taken from the Phase 1 fixtures in
# trading/fixtures/. Every other module reads Robinhood data only through this
# file. Numeric values arrive as decimal strings ("351.900000"), never floats.

import json
from typing import Any

TOOL_PREFIX = "mcp__robinhood__"
TOOL_QUOTES = "get_equity_quotes"
TOOL_REVIEW = "review_equity_order"


def response_payload(tool_response: Any) -> Any:
    """Decode a hook's tool_response, which Robinhood tools deliver as a JSON string."""
    if not isinstance(tool_response, str):
        return tool_response
    try:
        return json.loads(tool_response)
    except ValueError:
        return tool_response


# Every account-scoped tool takes the same parameter, filled from
# get_accounts.data.accounts[].account_number.
ACCOUNT_PARAM = "account_number"
ACCOUNT_SCOPED_TOOLS = frozenset(
    {
        "get_portfolio",
        "get_equity_positions",
        "get_equity_orders",
        "get_equity_tradability",
        "get_realized_pnl",
        "get_trade_approvals",
        "get_trade_approval_setting",
        "review_equity_order",
        "place_equity_order",
        "cancel_equity_order",
    }
)

# get_accounts: data.accounts[]
ACCOUNTS = ("data", "accounts")
ACCOUNT_NUMBER = "account_number"
ACCOUNT_AGENTIC = "agentic_allowed"

# review_equity_order / place_equity_order input
ORDER_SYMBOL = "symbol"
ORDER_SIDE = "side"  # "buy" | "sell"
ORDER_TYPE = "type"  # "market" | "limit" | "stop_market" | "stop_limit"
ORDER_QUANTITY = "quantity"  # shares; fractional only for market + gfd
ORDER_DOLLAR_AMOUNT = "dollar_amount"  # only with type=market, time_in_force=gfd
ORDER_LIMIT_PRICE = "limit_price"
ORDER_STOP_PRICE = "stop_price"
ORDER_TIME_IN_FORCE = "time_in_force"  # "gfd" | "gtc"
ORDER_MARKET_HOURS = "market_hours"  # "regular_hours" | "extended_hours" | "all_day_hours"

ORDER_INPUT_FIELDS = (
    ORDER_SYMBOL,
    ORDER_SIDE,
    ORDER_TYPE,
    ORDER_QUANTITY,
    ORDER_DOLLAR_AMOUNT,
    ORDER_LIMIT_PRICE,
    ORDER_STOP_PRICE,
    ORDER_TIME_IN_FORCE,
    ORDER_MARKET_HOURS,
)

# review_equity_order response: data.*
REVIEW_DATA = ("data",)
REVIEW_ORDER_CHECKS = "order_checks"  # {} when there are no broker alerts
REVIEW_APPROVAL_REQUIRED = "customer_approval_required"

# get_equity_quotes response: data.results[].quote.*
QUOTE_RESULTS = ("data", "results")
QUOTE = "quote"
QUOTE_SYMBOL = "symbol"
QUOTE_ASK = "ask_price"
QUOTE_BID = "bid_price"
QUOTE_LAST_TRADE = "last_trade_price"
QUOTE_STATE = "state"
QUOTE_STATE_ACTIVE = "active"

# get_portfolio response: data.*
PORTFOLIO = ("data",)
PORTFOLIO_TOTAL_VALUE = "total_value"
PORTFOLIO_EQUITY_VALUE = "equity_value"
PORTFOLIO_CASH = "cash"
PORTFOLIO_BUYING_POWER = ("buying_power", "buying_power")

# get_equity_positions response: data.positions[]. The tool returns no market
# price, so position value needs a quote.
POSITIONS = ("data", "positions")
POSITION_SYMBOL = "symbol"
POSITION_QUANTITY = "quantity"
POSITION_AVG_COST = "average_buy_price"

# get_equity_orders response: data.orders[]. The Agentic account had no orders
# during Phase 1, so these names come from the tool's guide text and must be
# confirmed against the first real order.
ORDERS = ("data", "orders")
ORDER_ID = "id"
ORDER_STATE = "state"
ORDER_DOLLAR_BASED_AMOUNT = "dollar_based_amount"
ORDER_CUMULATIVE_QUANTITY = "cumulative_quantity"
ORDER_PRICE = "price"
ORDER_AVERAGE_PRICE = "average_price"
ORDER_CREATED_AT = "created_at"
ORDER_LAST_TRANSACTION_AT = "last_transaction_at"

# get_trade_approval_setting response: data.setting.*
APPROVAL_SETTING = ("data", "setting")
APPROVAL_REQUIRED = "human_must_approve_trades"
