import pytest
from decimal import Decimal
from pathlib import Path

from app.services.parsers.monzo import parse_monzo_csv


@pytest.fixture
def monzo_csv_content():
    fixture_path = Path(__file__).parent / "fixtures" / "monzo_sample.csv"
    return fixture_path.read_text()


def test_parse_monzo_csv_returns_correct_count(monzo_csv_content):
    result = parse_monzo_csv(monzo_csv_content)
    assert len(result) == 6


def test_parse_monzo_csv_outgoing_is_negative(monzo_csv_content):
    result = parse_monzo_csv(monzo_csv_content)
    # Tesco -32.47 should stay negative
    tesco = result[0]
    assert tesco["amount"] == Decimal("-32.47")


def test_parse_monzo_csv_incoming_is_positive(monzo_csv_content):
    result = parse_monzo_csv(monzo_csv_content)
    # Salary of 3500.00 should be positive
    salary = result[4]
    assert salary["amount"] == Decimal("3500.00")


def test_parse_monzo_csv_date_parsing(monzo_csv_content):
    result = parse_monzo_csv(monzo_csv_content)
    assert result[0]["date"].day == 27
    assert result[0]["date"].month == 2
    assert result[0]["date"].year == 2026


def test_parse_monzo_csv_merchant_name(monzo_csv_content):
    result = parse_monzo_csv(monzo_csv_content)
    assert result[0]["merchant_name"] == "Tesco"
    assert result[3]["merchant_name"] == "Amazon"


def test_parse_monzo_csv_notes_in_description(monzo_csv_content):
    result = parse_monzo_csv(monzo_csv_content)
    # Tesco row has notes "Weekly shop"
    assert "Weekly shop" in result[0]["description"]


def test_parse_monzo_csv_description_fallback(monzo_csv_content):
    result = parse_monzo_csv(monzo_csv_content)
    # Netflix has no notes, uses Description field
    netflix = result[5]
    assert "NETFLIX.COM" in netflix["description"]


def test_parse_monzo_csv_empty_input():
    result = parse_monzo_csv("")
    assert result == []


def test_parse_monzo_csv_handles_missing_fields():
    csv_content = "Date,Time,Transaction Type,Name,Amount\n,,,,\n"
    result = parse_monzo_csv(csv_content)
    assert result == []
