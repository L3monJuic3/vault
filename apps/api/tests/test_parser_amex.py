import pytest
from decimal import Decimal
from pathlib import Path

from app.services.parsers.amex import parse_amex_csv


@pytest.fixture
def amex_csv_content():
    fixture_path = Path(__file__).parent / "fixtures" / "amex_sample.csv"
    return fixture_path.read_text()


def test_parse_amex_csv_returns_correct_count(amex_csv_content):
    result = parse_amex_csv(amex_csv_content)
    assert len(result) == 5


def test_parse_amex_csv_flips_charge_sign(amex_csv_content):
    result = parse_amex_csv(amex_csv_content)
    # Tesco charge of 45.67 should become -45.67
    tesco = result[0]
    assert tesco["amount"] == Decimal("-45.67")
    assert tesco["description"] == "TESCO STORES 2340"


def test_parse_amex_csv_payment_becomes_positive(amex_csv_content):
    result = parse_amex_csv(amex_csv_content)
    # Payment of -500.00 in Amex should become +500.00 in our system
    payment = result[3]
    assert payment["amount"] == Decimal("500.00")
    assert "PAYMENT" in payment["description"]


def test_parse_amex_csv_date_parsing(amex_csv_content):
    result = parse_amex_csv(amex_csv_content)
    assert result[0]["date"].day == 26
    assert result[0]["date"].month == 2
    assert result[0]["date"].year == 2026


def test_parse_amex_csv_merchant_name(amex_csv_content):
    result = parse_amex_csv(amex_csv_content)
    assert result[1]["merchant_name"] == "AMAZON.CO.UK*RT5KX"


def test_parse_amex_csv_empty_input():
    result = parse_amex_csv("")
    assert result == []


def test_parse_amex_csv_handles_missing_fields():
    csv_content = "Date,Description,Amount\n,,\n"
    result = parse_amex_csv(csv_content)
    assert result == []
