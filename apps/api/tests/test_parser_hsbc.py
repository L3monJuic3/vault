import pytest
from decimal import Decimal
from pathlib import Path

from app.services.parsers.hsbc import parse_hsbc_csv


@pytest.fixture
def hsbc_csv_content():
    fixture_path = Path(__file__).parent / "fixtures" / "hsbc_sample.csv"
    return fixture_path.read_text()


def test_parse_hsbc_csv_returns_correct_count(hsbc_csv_content):
    result = parse_hsbc_csv(hsbc_csv_content)
    assert len(result) == 6


def test_parse_hsbc_csv_paid_out_is_negative(hsbc_csv_content):
    result = parse_hsbc_csv(hsbc_csv_content)
    sky = result[0]
    assert sky["amount"] == Decimal("-45.00")
    assert sky["description"] == "SKY UK LIMITED"


def test_parse_hsbc_csv_paid_in_is_positive(hsbc_csv_content):
    result = parse_hsbc_csv(hsbc_csv_content)
    salary = result[3]
    assert salary["amount"] == Decimal("3500.00")


def test_parse_hsbc_csv_balance_parsed(hsbc_csv_content):
    result = parse_hsbc_csv(hsbc_csv_content)
    assert result[0]["balance_after"] == Decimal("1234.56")


def test_parse_hsbc_csv_date_parsing(hsbc_csv_content):
    result = parse_hsbc_csv(hsbc_csv_content)
    assert result[0]["date"].day == 26
    assert result[0]["date"].month == 2
    assert result[0]["date"].year == 2026


def test_parse_hsbc_csv_multi_line_description():
    csv_content = (
        "Date,Type,Description,Paid Out,Paid In,Balance\n"
        '26/02/2026,DD,"MULTI LINE\nDESCRIPTION HERE",10.00,,100.00\n'
    )
    result = parse_hsbc_csv(csv_content)
    assert len(result) == 1
    assert result[0]["description"] == "MULTI LINE DESCRIPTION HERE"


def test_parse_hsbc_csv_empty_input():
    result = parse_hsbc_csv("")
    assert result == []


def test_parse_hsbc_csv_merchant_name_matches_description(hsbc_csv_content):
    result = parse_hsbc_csv(hsbc_csv_content)
    for txn in result:
        assert txn["merchant_name"] == txn["description"]


def test_parse_hsbc_csv_amount_format():
    """Test that the simple Amount column format also works."""
    csv_content = (
        "Date,Description,Amount,Balance\n"
        "26/02/2026,TESCO STORES,-25.50,500.00\n"
        "25/02/2026,REFUND,10.00,525.50\n"
    )
    result = parse_hsbc_csv(csv_content)
    assert len(result) == 2
    assert result[0]["amount"] == Decimal("-25.50")
    assert result[1]["amount"] == Decimal("10.00")


def test_parse_hsbc_csv_skips_rows_without_date():
    csv_content = (
        "Date,Type,Description,Paid Out,Paid In,Balance\n"
        ",DD,ORPHAN ROW,10.00,,100.00\n"
        "26/02/2026,DD,VALID ROW,5.00,,95.00\n"
    )
    result = parse_hsbc_csv(csv_content)
    assert len(result) == 1
    assert result[0]["description"] == "VALID ROW"


def test_parse_hsbc_csv_skips_rows_without_description():
    csv_content = (
        "Date,Type,Description,Paid Out,Paid In,Balance\n26/02/2026,DD,,10.00,,100.00\n"
    )
    result = parse_hsbc_csv(csv_content)
    assert len(result) == 0


def test_parse_hsbc_csv_handles_commas_in_amounts():
    csv_content = (
        "Date,Type,Description,Paid Out,Paid In,Balance\n"
        '26/02/2026,CR,BIG SALARY,,"5,000.00","12,345.67"\n'
    )
    result = parse_hsbc_csv(csv_content)
    assert len(result) == 1
    assert result[0]["amount"] == Decimal("5000.00")
    assert result[0]["balance_after"] == Decimal("12345.67")
