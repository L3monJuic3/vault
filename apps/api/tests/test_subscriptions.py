"""Tests for subscription routes.

Since the router is not yet registered in main.py (that happens post-merge),
we create a standalone FastAPI app that includes only the subscriptions router.

The DB dependency is overridden with a mock async session. These tests verify
route registration, request validation, and response shape. Full integration
tests with a real DB will come later.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.routes.subscriptions import router

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_test_app() -> FastAPI:
    """Build a minimal FastAPI app with the subscriptions router."""
    test_app = FastAPI()
    test_app.include_router(router)
    return test_app


def _fake_user():
    """Return a mock User object."""
    user = MagicMock()
    user.id = uuid.uuid4()
    return user


def _mock_db_session(user=None):
    """Return an AsyncMock that behaves like an AsyncSession.

    When ``select(User).limit(1)`` is executed the mock returns *user*
    (or None if not provided).
    """
    session = AsyncMock()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = user
    session.execute.return_value = result_mock
    return session


def _fake_subscription(user_id=None):
    """Return a mock RecurringGroup with the attributes the schema expects."""
    sub = MagicMock()
    sub.id = uuid.uuid4()
    sub.user_id = user_id or uuid.uuid4()
    sub.name = "Netflix"
    sub.type = "subscription"
    sub.frequency = "monthly"
    sub.estimated_amount = 15.99
    sub.status = "active"
    sub.category_id = None
    sub.merchant_name = "Netflix"
    sub.next_expected_date = None
    sub.cancel_url = None
    sub.cancel_steps = None
    sub.created_at = datetime(2025, 1, 1, 0, 0, 0)
    return sub


# ---------------------------------------------------------------------------
# Route-existence / structure tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_router_has_expected_routes():
    """Verify the router object contains the three expected paths."""
    paths = {route.path for route in router.routes}
    prefix = "/api/v1/subscriptions"
    assert prefix in paths  # list subscriptions
    assert f"{prefix}/{{subscription_id}}" in paths  # update
    assert f"{prefix}/{{subscription_id}}/dismiss" in paths  # dismiss


# ---------------------------------------------------------------------------
# List subscriptions
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_subscriptions_returns_items_and_total():
    """GET /api/v1/subscriptions returns items and monthly_total."""
    user = _fake_user()
    db = _mock_db_session(user)
    sub = _fake_subscription(user.id)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    with (
        patch(
            "app.routes.subscriptions.get_subscriptions",
            return_value=[sub],
        ),
        patch(
            "app.routes.subscriptions.get_monthly_total",
            return_value=Decimal("15.99"),
        ),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/subscriptions")

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["name"] == "Netflix"
    assert body["monthly_total"] == 15.99


@pytest.mark.asyncio
async def test_list_subscriptions_401_when_no_user():
    """GET /api/v1/subscriptions returns 401 when no user exists."""
    db = _mock_db_session(user=None)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/subscriptions")

    assert response.status_code == 401
    assert response.json()["detail"] == "No user found"


# ---------------------------------------------------------------------------
# Update subscription
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_subscription_returns_updated():
    """PATCH /api/v1/subscriptions/{id} returns the updated subscription."""
    user = _fake_user()
    db = _mock_db_session(user)
    sub = _fake_subscription(user.id)
    sub.status = "cancelled"

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    with patch(
        "app.routes.subscriptions.update_subscription",
        return_value=sub,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.patch(
                f"/api/v1/subscriptions/{sub.id}",
                json={"status": "cancelled"},
            )

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_update_subscription_404_when_missing():
    """PATCH returns 404 when the subscription is not found."""
    user = _fake_user()
    db = _mock_db_session(user)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    fake_id = uuid.uuid4()

    with patch(
        "app.routes.subscriptions.update_subscription",
        return_value=None,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.patch(
                f"/api/v1/subscriptions/{fake_id}",
                json={"status": "paused"},
            )

    assert response.status_code == 404
    assert response.json()["detail"] == "Subscription not found"


@pytest.mark.asyncio
async def test_patch_invalid_uuid_returns_422():
    """PATCH with an invalid UUID should return 422 (validation error)."""
    app = _make_test_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.patch(
            "/api/v1/subscriptions/not-a-uuid",
            json={"status": "cancelled"},
        )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Dismiss subscription
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dismiss_subscription_returns_cancelled():
    """POST /api/v1/subscriptions/{id}/dismiss returns the cancelled sub."""
    user = _fake_user()
    db = _mock_db_session(user)
    sub = _fake_subscription(user.id)
    sub.status = "cancelled"

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    with patch(
        "app.routes.subscriptions.dismiss_subscription",
        return_value=sub,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(f"/api/v1/subscriptions/{sub.id}/dismiss")

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_dismiss_subscription_404_when_missing():
    """POST dismiss returns 404 when subscription is not found."""
    user = _fake_user()
    db = _mock_db_session(user)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    fake_id = uuid.uuid4()

    with patch(
        "app.routes.subscriptions.dismiss_subscription",
        return_value=None,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(f"/api/v1/subscriptions/{fake_id}/dismiss")

    assert response.status_code == 404
    assert response.json()["detail"] == "Subscription not found"
