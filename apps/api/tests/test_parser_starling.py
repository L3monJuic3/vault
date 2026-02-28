import pytest
from decimal import Decimal
from pathlib import Path

from app.services.parsers.starling import parse_starling_csv


@pytest.fixture
def starling_csv_content():
    fixture_path = Path(__file__).parent / "fixtures" / "starling_sample.csv"
    return fixture_path.read_text()


def test_parse_starling_csv_returns_correct_count(starling_csv_content):
    result = parse_starling_csv(starling_csv_content)
    assert len(result) == 6


def test_parse_starling_csv_outgoing_is_negative(starling_csv_content):
    result = parse_starling_csv(starling_csv_content)
    tesco = result[0]
    assert tesco["amount"] == Decimal("-32.47")


def test_parse_starling_csv_incoming_is_positive(starling_csv_content):
    result = parse_starling_csv(starling_csv_content)
    salary = result[4]
    assert salary["amount"] == Decimal("3500.00")


def test_parse_starling_csv_date_parsing(starling_csv_content):
    result = parse_starling_csv(starling_csv_content)
    assert result[0]["date"].day == 27
    assert result[0]["date"].month == 2
    assert result[0]["date"].year == 2026


def test_parse_starling_csv_merchant_name(starling_csv_content):
    result = parse_starling_csv(starling_csv_content)
    assert result[0]["merchant_name"] == "Tesco"
    assert result[5]["merchant_name"] == "Netflix"


def test_parse_starling_csv_description_uses_reference(starling_csv_content):
    result = parse_starling_csv(starling_csv_content)
    assert result[0]["description"] == "TESCO STORES 2340"
    assert result[4]["description"] == "SALARY FEB 2026"


def test_parse_starling_csv_balance_parsed(starling_csv_content):
    result = parse_starling_csv(starling_csv_content)
    assert result[0]["balance_after"] == Decimal("1234.56")


def test_parse_starling_csv_empty_input():
    result = parse_starling_csv("")
    assert result == []


def test_parse_starling_csv_handles_missing_fields():
    csv_content = (
        "Date,Counter Party,Reference,Type,Amount (GBP),Balance (GBP)\n,,,,,\n"
    )
    result = parse_starling_csv(csv_content)
    assert result == []
