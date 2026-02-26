import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from app.ai.subscription_detector import (
    _detect_frequency,
    _predict_next_date,
    detect_subscriptions,
)
from app.models.recurring_group import Frequency


class TestDetectFrequency:
    def test_weekly(self):
        dates = [
            datetime(2026, 1, 1).date(),
            datetime(2026, 1, 8).date(),
            datetime(2026, 1, 15).date(),
        ]
        assert _detect_frequency(dates) == Frequency.weekly

    def test_monthly(self):
        dates = [
            datetime(2026, 1, 1).date(),
            datetime(2026, 2, 1).date(),
            datetime(2026, 3, 1).date(),
        ]
        assert _detect_frequency(dates) == Frequency.monthly

    def test_quarterly(self):
        dates = [
            datetime(2026, 1, 1).date(),
            datetime(2026, 4, 1).date(),
            datetime(2026, 7, 1).date(),
        ]
        assert _detect_frequency(dates) == Frequency.quarterly

    def test_annual(self):
        dates = [
            datetime(2024, 1, 1).date(),
            datetime(2025, 1, 1).date(),
            datetime(2026, 1, 1).date(),
        ]
        assert _detect_frequency(dates) == Frequency.annual

    def test_insufficient_dates(self):
        assert _detect_frequency([datetime(2026, 1, 1).date()]) is None

    def test_irregular_returns_none(self):
        dates = [
            datetime(2026, 1, 1).date(),
            datetime(2026, 1, 5).date(),
            datetime(2026, 3, 20).date(),
        ]
        assert _detect_frequency(dates) is None


class TestPredictNextDate:
    def test_monthly_prediction(self):
        dates = [datetime(2026, 1, 15).date(), datetime(2026, 2, 15).date()]
        result = _predict_next_date(dates, Frequency.monthly)
        assert result == datetime(2026, 2, 15).date() + timedelta(days=30)

    def test_weekly_prediction(self):
        dates = [datetime(2026, 1, 1).date(), datetime(2026, 1, 8).date()]
        result = _predict_next_date(dates, Frequency.weekly)
        assert result == datetime(2026, 1, 8).date() + timedelta(days=7)

    def test_quarterly_prediction(self):
        dates = [datetime(2026, 1, 1).date(), datetime(2026, 4, 1).date()]
        result = _predict_next_date(dates, Frequency.quarterly)
        assert result == datetime(2026, 4, 1).date() + timedelta(days=91)

    def test_annual_prediction(self):
        dates = [datetime(2025, 1, 1).date(), datetime(2026, 1, 1).date()]
        result = _predict_next_date(dates, Frequency.annual)
        assert result == datetime(2026, 1, 1).date() + timedelta(days=365)


class TestDetectSubscriptions:
    """Test the full detect_subscriptions function with mock DB."""

    def _make_transaction(
        self,
        merchant_name: str,
        amount: Decimal,
        txn_date: datetime,
        description: str = "Payment",
    ):
        """Create a mock Transaction object."""
        txn = MagicMock()
        txn.merchant_name = merchant_name
        txn.description = description
        txn.amount = amount
        txn.date = txn_date
        txn.is_recurring = False
        txn.recurring_group_id = None
        return txn

    @pytest.mark.asyncio
    async def test_detects_monthly_subscription(self):
        """Should detect a monthly subscription from 3 similar transactions."""
        user_id = uuid4()
        transactions = [
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 1, 1)),
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 2, 1)),
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 3, 1)),
        ]

        db = AsyncMock()
        # Mock the existing group check to return None (no existing group)
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        db.execute.return_value = result_mock

        groups = await detect_subscriptions(db, user_id, transactions)

        assert len(groups) == 1
        assert groups[0].name == "Netflix"
        assert groups[0].frequency == Frequency.monthly
        assert groups[0].estimated_amount == Decimal("15.99")

    @pytest.mark.asyncio
    async def test_skips_when_too_few_transactions(self):
        """Should not detect a subscription from fewer than 3 transactions."""
        user_id = uuid4()
        transactions = [
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 1, 1)),
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 2, 1)),
        ]

        db = AsyncMock()
        groups = await detect_subscriptions(db, user_id, transactions)

        assert len(groups) == 0

    @pytest.mark.asyncio
    async def test_skips_inconsistent_amounts(self):
        """Should skip if amounts vary too much."""
        user_id = uuid4()
        transactions = [
            self._make_transaction(
                "Random Shop", Decimal("-10.00"), datetime(2026, 1, 1)
            ),
            self._make_transaction(
                "Random Shop", Decimal("-50.00"), datetime(2026, 2, 1)
            ),
            self._make_transaction(
                "Random Shop", Decimal("-100.00"), datetime(2026, 3, 1)
            ),
        ]

        db = AsyncMock()
        groups = await detect_subscriptions(db, user_id, transactions)

        assert len(groups) == 0

    @pytest.mark.asyncio
    async def test_skips_irregular_frequency(self):
        """Should skip if dates don't match a known frequency."""
        user_id = uuid4()
        transactions = [
            self._make_transaction("Random", Decimal("-10.00"), datetime(2026, 1, 1)),
            self._make_transaction("Random", Decimal("-10.00"), datetime(2026, 1, 5)),
            self._make_transaction("Random", Decimal("-10.00"), datetime(2026, 3, 20)),
        ]

        db = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        db.execute.return_value = result_mock

        groups = await detect_subscriptions(db, user_id, transactions)

        assert len(groups) == 0

    @pytest.mark.asyncio
    async def test_skips_existing_group(self):
        """Should not create a duplicate if RecurringGroup already exists."""
        user_id = uuid4()
        transactions = [
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 1, 1)),
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 2, 1)),
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 3, 1)),
        ]

        db = AsyncMock()
        # Simulate existing group found
        existing_group = MagicMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing_group
        db.execute.return_value = result_mock

        groups = await detect_subscriptions(db, user_id, transactions)

        assert len(groups) == 0

    @pytest.mark.asyncio
    async def test_detects_direct_debit_type(self):
        """Should classify council/water/electric/gas as direct_debit."""
        user_id = uuid4()
        transactions = [
            self._make_transaction(
                "Council Tax", Decimal("-150.00"), datetime(2026, 1, 1)
            ),
            self._make_transaction(
                "Council Tax", Decimal("-150.00"), datetime(2026, 2, 1)
            ),
            self._make_transaction(
                "Council Tax", Decimal("-150.00"), datetime(2026, 3, 1)
            ),
        ]

        db = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        db.execute.return_value = result_mock

        groups = await detect_subscriptions(db, user_id, transactions)

        assert len(groups) == 1
        assert groups[0].type == "direct_debit"

    @pytest.mark.asyncio
    async def test_detects_salary_type(self):
        """Should classify salary/wages/pay as salary."""
        user_id = uuid4()
        transactions = [
            self._make_transaction(
                "ACME Salary", Decimal("3000.00"), datetime(2026, 1, 28)
            ),
            self._make_transaction(
                "ACME Salary", Decimal("3000.00"), datetime(2026, 2, 28)
            ),
            self._make_transaction(
                "ACME Salary", Decimal("3000.00"), datetime(2026, 3, 28)
            ),
        ]

        db = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        db.execute.return_value = result_mock

        groups = await detect_subscriptions(db, user_id, transactions)

        assert len(groups) == 1
        assert groups[0].type == "salary"

    @pytest.mark.asyncio
    async def test_multiple_subscriptions_detected(self):
        """Should detect multiple different subscriptions."""
        user_id = uuid4()
        transactions = [
            # Netflix - monthly
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 1, 1)),
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 2, 1)),
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 3, 1)),
            # Spotify - monthly
            self._make_transaction("Spotify", Decimal("-9.99"), datetime(2026, 1, 15)),
            self._make_transaction("Spotify", Decimal("-9.99"), datetime(2026, 2, 15)),
            self._make_transaction("Spotify", Decimal("-9.99"), datetime(2026, 3, 15)),
        ]

        db = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        db.execute.return_value = result_mock

        groups = await detect_subscriptions(db, user_id, transactions)

        assert len(groups) == 2
        names = {g.name for g in groups}
        assert "Netflix" in names
        assert "Spotify" in names

    @pytest.mark.asyncio
    async def test_uses_description_when_no_merchant(self):
        """Should fall back to description for grouping when merchant_name is None."""
        user_id = uuid4()
        transactions = [
            self._make_transaction(
                None, Decimal("-15.99"), datetime(2026, 1, 1), description="NETFLIX"
            ),
            self._make_transaction(
                None, Decimal("-15.99"), datetime(2026, 2, 1), description="NETFLIX"
            ),
            self._make_transaction(
                None, Decimal("-15.99"), datetime(2026, 3, 1), description="NETFLIX"
            ),
        ]

        db = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        db.execute.return_value = result_mock

        groups = await detect_subscriptions(db, user_id, transactions)

        assert len(groups) == 1
        assert groups[0].name == "NETFLIX"

    @pytest.mark.asyncio
    async def test_marks_transactions_as_recurring(self):
        """Should set is_recurring=True on matched transactions."""
        user_id = uuid4()
        transactions = [
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 1, 1)),
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 2, 1)),
            self._make_transaction("Netflix", Decimal("-15.99"), datetime(2026, 3, 1)),
        ]

        db = AsyncMock()
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        db.execute.return_value = result_mock

        await detect_subscriptions(db, user_id, transactions)

        for txn in transactions:
            assert txn.is_recurring is True
