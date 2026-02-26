"""Tests for transaction routes.

Since the router is not yet registered in main.py (that happens post-merge),
we create a standalone FastAPI app that includes only the transactions router.

The DB dependency is overridden with a mock async session. These tests verify
route registration, request validation, and response shape. Full integration
tests with a real DB will come later.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.routes.transactions import router

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_test_app() -> FastAPI:
    """Build a minimal FastAPI app with the transactions router."""
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

    When `select(User).limit(1)` is executed, the mock returns `user`
    (or None if not provided).
    """
    session = AsyncMock()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = user
    session.execute.return_value = result_mock
    return session


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_transactions_returns_empty_list():
    """GET /api/v1/transactions returns an empty cursor page when there is a
    user but no transactions."""
    user = _fake_user()
    db = _mock_db_session(user)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    with patch(
        "app.routes.transactions.get_transactions",
        return_value=([], None, False),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/transactions")

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["next_cursor"] is None
    assert body["has_more"] is False


@pytest.mark.asyncio
async def test_list_transactions_401_when_auth_required_no_token():
    """GET /api/v1/transactions returns 401 when auth is required and no token is provided."""
    app = _make_test_app()
    db = _mock_db_session(user=None)

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.middleware.auth.settings") as mock_settings:
            mock_settings.auth_required = True
            mock_settings.jwt_secret = "change-me-in-production"
            response = await client.get("/api/v1/transactions")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_transaction_returns_404_for_missing():
    """GET /api/v1/transactions/{id} returns 404 for a non-existent transaction."""
    user = _fake_user()
    db = _mock_db_session(user)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    fake_id = uuid.uuid4()

    with patch(
        "app.routes.transactions.get_transaction_by_id",
        return_value=None,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(f"/api/v1/transactions/{fake_id}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Transaction not found"


@pytest.mark.asyncio
async def test_patch_transaction_returns_404_for_missing():
    """PATCH /api/v1/transactions/{id} returns 404 for a non-existent transaction."""
    user = _fake_user()
    db = _mock_db_session(user)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    fake_id = uuid.uuid4()

    with patch(
        "app.routes.transactions.update_transaction",
        return_value=None,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.patch(
                f"/api/v1/transactions/{fake_id}",
                json={"notes": "testing"},
            )

    assert response.status_code == 404
    assert response.json()["detail"] == "Transaction not found"


@pytest.mark.asyncio
async def test_bulk_assign_category():
    """POST /api/v1/transactions/bulk updates transactions and returns count."""
    user = _fake_user()
    db = _mock_db_session(user)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    txn_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
    category_id = str(uuid.uuid4())

    with patch(
        "app.routes.transactions.bulk_update_category",
        return_value=2,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/transactions/bulk",
                json={
                    "transaction_ids": txn_ids,
                    "category_id": category_id,
                },
            )

    assert response.status_code == 200
    body = response.json()
    assert body["updated"] == 2


@pytest.mark.asyncio
async def test_bulk_assign_category_validation_error():
    """POST /api/v1/transactions/bulk returns 422 for invalid body."""
    user = _fake_user()
    db = _mock_db_session(user)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/transactions/bulk",
            json={"transaction_ids": ["not-a-uuid"], "category_id": "also-bad"},
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_transactions_with_query_params():
    """GET /api/v1/transactions accepts filter query params without error."""
    user = _fake_user()
    db = _mock_db_session(user)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    with patch(
        "app.routes.transactions.get_transactions",
        return_value=([], None, False),
    ) as mock_get:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/transactions",
                params={
                    "limit": 10,
                    "amount_min": "5.00",
                    "amount_max": "500.00",
                    "search": "groceries",
                },
            )

    assert response.status_code == 200
    # Verify the service was called with the filter params
    mock_get.assert_called_once()
    call_kwargs = mock_get.call_args
    assert call_kwargs.kwargs["limit"] == 10
    assert call_kwargs.kwargs["search"] == "groceries"


@pytest.mark.asyncio
async def test_list_transactions_limit_validation():
    """GET /api/v1/transactions rejects limit outside [1, 100]."""
    user = _fake_user()
    db = _mock_db_session(user)

    app = _make_test_app()

    async def override_get_db():
        yield db

    from app.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp_too_high = await client.get("/api/v1/transactions", params={"limit": 200})
        resp_too_low = await client.get("/api/v1/transactions", params={"limit": 0})

    assert resp_too_high.status_code == 422
    assert resp_too_low.status_code == 422
