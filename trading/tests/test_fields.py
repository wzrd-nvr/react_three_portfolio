import json
from pathlib import Path

from lib import fields

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"


def load(name):
    return json.loads((FIXTURES / f"{name}.json").read_text())


def dig(value, path):
    for key in path:
        value = value[key]
    return value


def test_exactly_one_agentic_account_in_fixture():
    accounts = dig(load("get_accounts"), fields.ACCOUNTS)
    agentic = [a for a in accounts if a[fields.ACCOUNT_AGENTIC] is True]
    assert len(agentic) == 1
    assert all(fields.ACCOUNT_NUMBER in a for a in accounts)


def test_quote_fields_exist():
    quote = dig(load("get_equity_quotes"), fields.QUOTE_RESULTS)[0][fields.QUOTE]
    for key in (fields.QUOTE_SYMBOL, fields.QUOTE_ASK, fields.QUOTE_BID, fields.QUOTE_LAST_TRADE, fields.QUOTE_STATE):
        assert isinstance(quote[key], str)


def test_portfolio_fields_exist():
    portfolio = dig(load("get_portfolio"), fields.PORTFOLIO)
    for key in (fields.PORTFOLIO_TOTAL_VALUE, fields.PORTFOLIO_EQUITY_VALUE, fields.PORTFOLIO_CASH):
        assert isinstance(portfolio[key], str)
    assert isinstance(dig(portfolio, fields.PORTFOLIO_BUYING_POWER), str)


def test_review_echoes_order_input_fields():
    review = dig(load("review_equity_order_market_dollar"), fields.REVIEW_DATA)
    assert review[fields.ORDER_DOLLAR_AMOUNT] == "1.00"
    assert review[fields.REVIEW_ORDER_CHECKS] == {}
    limit = dig(load("review_equity_order_limit_shares"), fields.REVIEW_DATA)
    assert limit[fields.ORDER_QUANTITY] == "1"
    assert limit[fields.ORDER_LIMIT_PRICE] == "1.00"
    assert limit[fields.REVIEW_ORDER_CHECKS]


def test_approval_setting_field_exists():
    setting = dig(load("get_trade_approval_setting"), fields.APPROVAL_SETTING)
    assert isinstance(setting[fields.APPROVAL_REQUIRED], bool)
    assert setting[fields.ACCOUNT_PARAM]
