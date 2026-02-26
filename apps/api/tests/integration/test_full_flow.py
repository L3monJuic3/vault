"""End-to-end integration tests for the import-to-dashboard flow.

Exercises the full user journey: register -> login -> create transactions
(simulating CSV import) -> list/search/paginate -> subscriptions -> dashboard
aggregation.

Uses a real SQLite DB for User (auth) and mocks transaction/subscription
service functions for route-level testing (SQLite cannot handle the
PostgreSQL ARRAY column on the Transaction model).
"""

import uuid
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from app.services.auth_service import decode_access_token


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _fake_transaction(user_id, **overrides):
    """Build a mock transaction object that satisfies TransactionRead."""
    txn = MagicMock()
    txn.id = overrides.get("id", uuid.uuid4())
    txn.account_id = overrides.get("account_id", uuid.uuid4())
    txn.date = overrides.get("date", datetime(2025, 6, 15, 12, 0, 0))
    txn.description = overrides.get("description", "Countdown Supermarket")
    txn.amount = overrides.get("amount", -42.50)
    txn.balance_after = overrides.get("balance_after", 1200.00)
    txn.category_id = overrides.get("category_id", None)
    txn.subcategory = overrides.get("subcategory", None)
    txn.merchant_name = overrides.get("merchant_name", "Countdown")
    txn.is_recurring = overrides.get("is_recurring", False)
    txn.recurring_group_id = overrides.get("recurring_group_id", None)
    txn.notes = overrides.get("notes", None)
    txn.tags = overrides.get("tags", [])
    txn.ai_confidence = overrides.get("ai_confidence", None)
    txn.import_id = overrides.get("import_id", None)
    txn.created_at = overrides.get("created_at", datetime(2025, 6, 15, 12, 0, 0))
    return txn


def _fake_subscription(user_id, **overrides):
    """Build a mock RecurringGroup that satisfies RecurringGroupRead."""
    sub = MagicMock()
    sub.id = overrides.get("id", uuid.uuid4())
    sub.user_id = user_id
    sub.name = overrides.get("name", "Spotify")
    sub.type = overrides.get("type", "subscription")
    sub.frequency = overrides.get("frequency", "monthly")
    sub.estimated_amount = overrides.get("estimated_amount", 16.99)
    sub.status = overrides.get("status", "active")
    sub.category_id = overrides.get("category_id", None)
    sub.merchant_name = overrides.get("merchant_name", "Spotify")
    sub.next_expected_date = overrides.get("next_expected_date", None)
    sub.cancel_url = overrides.get("cancel_url", None)
    sub.cancel_steps = overrides.get("cancel_steps", None)
    sub.created_at = overrides.get("created_at", datetime(2025, 1, 1, 0, 0, 0))
    return sub


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestFullUserFlow:
    """End-to-end tests covering register -> login -> transactions ->
    subscriptions -> dashboard aggregation."""

    # -- Auth ---------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_register_user(self, client):
        """Registering a new user returns 201 with user data."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "flow@vault.test",
                "name": "Flow User",
                "password": "testpassword1",
                "currency": "NZD",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "flow@vault.test"
        assert data["name"] == "Flow User"
        assert data["currency"] == "NZD"
        assert "id" in data
        assert "created_at" in data
        # Sensitive fields must never appear
        assert "password" not in data
        assert "password_hash" not in data

    @pytest.mark.asyncio
    async def test_login_and_get_token(self, client, registered_user):
        """Logging in with valid credentials returns a JWT access token
        that decodes to the registered user's id."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "e2e@vault.test", "password": "securepassword123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        # Token should decode to the registered user's UUID
        decoded_uid = decode_access_token(data["access_token"])
        assert decoded_uid is not None
        assert str(decoded_uid) == registered_user["id"]

    # -- Transactions (mocked service) --------------------------------------

    @pytest.mark.asyncio
    async def test_create_and_list_transactions(self, client, registered_user):
        """After registering, listing transactions returns items from the
        service (simulating CSV import results)."""
        user_id = uuid.UUID(registered_user["id"])
        account_id = uuid.uuid4()

        txns = [
            _fake_transaction(
                user_id,
                account_id=account_id,
                description="Countdown Supermarket",
                amount=-52.30,
            ),
            _fake_transaction(
                user_id,
                account_id=account_id,
                description="Salary Payment",
                amount=3500.00,
            ),
            _fake_transaction(
                user_id,
                account_id=account_id,
                description="Petrol Station",
                amount=-78.00,
            ),
        ]

        with patch(
            "app.routes.transactions.get_transactions",
            return_value=(txns, None, False),
        ):
            response = await client.get("/api/v1/transactions")

        assert response.status_code == 200
        body = response.json()
        assert len(body["items"]) == 3
        assert body["has_more"] is False
        assert body["next_cursor"] is None

        descriptions = [item["description"] for item in body["items"]]
        assert "Countdown Supermarket" in descriptions
        assert "Salary Payment" in descriptions
        assert "Petrol Station" in descriptions

    @pytest.mark.asyncio
    async def test_search_transactions(self, client, registered_user):
        """Searching transactions passes the filter to the service and
        returns matching results."""
        user_id = uuid.UUID(registered_user["id"])
        matching_txn = _fake_transaction(
            user_id, description="Countdown Groceries", amount=-35.00
        )

        with patch(
            "app.routes.transactions.get_transactions",
            return_value=([matching_txn], None, False),
        ) as mock_get:
            response = await client.get(
                "/api/v1/transactions",
                params={"search": "groceries", "limit": 10},
            )

        assert response.status_code == 200
        body = response.json()
        assert len(body["items"]) == 1
        assert body["items"][0]["description"] == "Countdown Groceries"

        # Verify the service received the filter params
        mock_get.assert_called_once()
        call_kwargs = mock_get.call_args
        assert call_kwargs.kwargs["search"] == "groceries"
        assert call_kwargs.kwargs["limit"] == 10

    @pytest.mark.asyncio
    async def test_cursor_pagination(self, client, registered_user):
        """Cursor pagination returns the next_cursor and has_more flag,
        and a subsequent request uses the cursor."""
        user_id = uuid.UUID(registered_user["id"])
        next_cursor_id = uuid.uuid4()

        page1_txns = [
            _fake_transaction(user_id, description=f"Txn {i}") for i in range(3)
        ]

        # First page: has_more=True with a cursor
        with patch(
            "app.routes.transactions.get_transactions",
            return_value=(page1_txns, next_cursor_id, True),
        ):
            resp1 = await client.get("/api/v1/transactions", params={"limit": 3})

        assert resp1.status_code == 200
        body1 = resp1.json()
        assert body1["has_more"] is True
        assert body1["next_cursor"] == str(next_cursor_id)
        assert len(body1["items"]) == 3

        # Second page: no more results
        page2_txns = [_fake_transaction(user_id, description="Last Txn")]
        with patch(
            "app.routes.transactions.get_transactions",
            return_value=(page2_txns, None, False),
        ) as mock_get:
            resp2 = await client.get(
                "/api/v1/transactions",
                params={"cursor": str(next_cursor_id), "limit": 3},
            )

        assert resp2.status_code == 200
        body2 = resp2.json()
        assert body2["has_more"] is False
        assert body2["next_cursor"] is None
        assert len(body2["items"]) == 1

        # Verify the cursor was forwarded to the service
        mock_get.assert_called_once()
        call_kwargs = mock_get.call_args
        assert call_kwargs.kwargs["cursor"] == next_cursor_id

    @pytest.mark.asyncio
    async def test_bulk_category_assignment(self, client, registered_user):
        """Bulk category assignment updates multiple transactions at once."""
        txn_ids = [str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())]
        category_id = str(uuid.uuid4())

        with patch(
            "app.routes.transactions.bulk_update_category",
            return_value=3,
        ):
            response = await client.post(
                "/api/v1/transactions/bulk",
                json={
                    "transaction_ids": txn_ids,
                    "category_id": category_id,
                },
            )

        assert response.status_code == 200
        body = response.json()
        assert body["updated"] == 3

    # -- Subscriptions (mocked service) -------------------------------------

    @pytest.mark.asyncio
    async def test_subscriptions_list(self, client, registered_user):
        """Listing subscriptions returns items and the monthly total
        (dashboard-style aggregation)."""
        user_id = uuid.UUID(registered_user["id"])

        subs = [
            _fake_subscription(user_id, name="Spotify", estimated_amount=16.99),
            _fake_subscription(user_id, name="Netflix", estimated_amount=22.99),
            _fake_subscription(user_id, name="iCloud+", estimated_amount=1.99),
        ]

        with (
            patch(
                "app.routes.subscriptions.get_subscriptions",
                return_value=subs,
            ),
            patch(
                "app.routes.subscriptions.get_monthly_total",
                return_value=Decimal("41.97"),
            ),
        ):
            response = await client.get("/api/v1/subscriptions")

        assert response.status_code == 200
        body = response.json()
        assert len(body["items"]) == 3
        assert body["monthly_total"] == 41.97

        names = [item["name"] for item in body["items"]]
        assert "Spotify" in names
        assert "Netflix" in names
        assert "iCloud+" in names

    @pytest.mark.asyncio
    async def test_subscription_dismiss(self, client, registered_user):
        """Dismissing a subscription returns it with status=cancelled."""
        user_id = uuid.UUID(registered_user["id"])
        sub_id = uuid.uuid4()

        dismissed_sub = _fake_subscription(
            user_id,
            id=sub_id,
            name="Old Gym Membership",
            status="cancelled",
        )

        with patch(
            "app.routes.subscriptions.dismiss_subscription",
            return_value=dismissed_sub,
        ):
            response = await client.post(f"/api/v1/subscriptions/{sub_id}/dismiss")

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "cancelled"
        assert body["name"] == "Old Gym Membership"

    # -- Health check -------------------------------------------------------

    @pytest.mark.asyncio
    async def test_health_endpoint(self, client):
        """The health endpoint should always respond with 200."""
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
