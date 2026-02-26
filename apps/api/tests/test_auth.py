"""Tests for auth routes, auth service, and auth middleware."""

from unittest.mock import patch
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import StaticPool, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.models.user import User
from app.services.auth_service import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

# ---------------------------------------------------------------------------
# Async in-memory SQLite setup
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite://"


@pytest_asyncio.fixture
async def db_session():
    """Create a fresh async in-memory SQLite database for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enable foreign keys on SQLite connections
    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # Only create the users table — other models use PostgreSQL-only types
    # (e.g. ARRAY) that SQLite cannot handle.
    async with engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: User.__table__.create(sync_conn, checkfirst=True)
        )

    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: User.__table__.drop(sync_conn, checkfirst=True)
        )
    await engine.dispose()


@pytest.fixture
def app_with_db(db_session):
    """Return the FastAPI app with the DB dependency overridden."""
    from app.main import app

    async def _override_get_db():
        try:
            yield db_session
            await db_session.commit()
        except Exception:
            await db_session.rollback()
            raise

    app.dependency_overrides[get_db] = _override_get_db
    yield app
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(app_with_db):
    """AsyncClient bound to the test app."""
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# ---------------------------------------------------------------------------
# Unit tests: auth_service helpers
# ---------------------------------------------------------------------------


class TestPasswordHashing:
    def test_hash_password_returns_bcrypt_string(self):
        hashed = hash_password("mysecret")
        assert hashed.startswith("$2")
        assert len(hashed) == 60

    def test_verify_password_correct(self):
        hashed = hash_password("mysecret")
        assert verify_password("mysecret", hashed) is True

    def test_verify_password_wrong(self):
        hashed = hash_password("mysecret")
        assert verify_password("wrongpassword", hashed) is False


class TestJWT:
    def test_create_and_decode_token(self):
        uid = uuid4()
        token = create_access_token(uid)
        decoded_uid = decode_access_token(token)
        assert decoded_uid == uid

    def test_decode_invalid_token_returns_none(self):
        assert decode_access_token("not.a.real.token") is None

    def test_decode_tampered_token_returns_none(self):
        uid = uuid4()
        token = create_access_token(uid)
        # Flip a character in the token payload
        parts = token.split(".")
        payload = parts[1]
        tampered = payload[:-1] + ("A" if payload[-1] != "A" else "B")
        tampered_token = f"{parts[0]}.{tampered}.{parts[2]}"
        assert decode_access_token(tampered_token) is None


# ---------------------------------------------------------------------------
# Integration tests: register & login endpoints
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_creates_user(client):
    """Register creates a user and returns UserRead."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "name": "Test User",
            "password": "strongpassword123",
            "currency": "USD",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert data["currency"] == "USD"
    assert "id" in data
    assert "created_at" in data
    # password_hash should NOT be in the response
    assert "password" not in data
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_409(client):
    """Register with a duplicate email returns 409 Conflict."""
    payload = {
        "email": "dup@example.com",
        "name": "First User",
        "password": "password1",
    }
    resp1 = await client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    payload["name"] = "Second User"
    payload["password"] = "password2"
    resp2 = await client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 409
    assert "already exists" in resp2.json()["detail"]


@pytest.mark.asyncio
async def test_login_valid_credentials(client):
    """Login with valid credentials returns an access token."""
    # Register first
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "name": "Login User",
            "password": "correctpassword",
        },
    )

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "correctpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Token should decode to a valid UUID
    uid = decode_access_token(data["access_token"])
    assert uid is not None


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client):
    """Login with wrong password returns 401."""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrong@example.com",
            "name": "Wrong Pass",
            "password": "correctpassword",
        },
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@example.com", "password": "badpassword"},
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user_returns_401(client):
    """Login with a non-existent email returns 401."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "whatever"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Middleware tests: auth_required toggle
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_protected_endpoint_rejects_without_token_when_auth_required(
    app_with_db,
):
    """When AUTH_REQUIRED=true, endpoints using get_current_user reject
    requests that lack a valid Bearer token."""
    from fastapi import Depends

    from app.middleware.auth import get_current_user

    # Add a temporary protected route
    @app_with_db.get("/test-protected")
    async def protected_route(user=Depends(get_current_user)):
        return {"user_id": str(user.id)}

    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        with patch("app.middleware.auth.settings") as mock_settings:
            mock_settings.auth_required = True
            mock_settings.jwt_secret = "change-me-in-production"

            # No Authorization header
            resp = await c.get("/test-protected")
            assert resp.status_code == 401

            # Invalid token
            resp = await c.get(
                "/test-protected",
                headers={"Authorization": "Bearer invalid.token.here"},
            )
            assert resp.status_code == 401

    # Clean up the route
    app_with_db.routes[:] = [
        r for r in app_with_db.routes if getattr(r, "path", None) != "/test-protected"
    ]


@pytest.mark.asyncio
async def test_auth_not_required_creates_default_user(app_with_db):
    """When AUTH_REQUIRED=false, endpoints using get_current_user work
    without auth and automatically create/return a default user."""
    from fastapi import Depends

    from app.middleware.auth import get_current_user

    @app_with_db.get("/test-no-auth")
    async def no_auth_route(user=Depends(get_current_user)):
        return {"user_id": str(user.id), "email": user.email}

    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        with patch("app.middleware.auth.settings") as mock_settings:
            mock_settings.auth_required = False

            resp = await c.get("/test-no-auth")
            assert resp.status_code == 200
            data = resp.json()
            assert data["email"] == "default@vault.local"

            # Second call returns same user
            resp2 = await c.get("/test-no-auth")
            assert resp2.status_code == 200
            assert resp2.json()["user_id"] == data["user_id"]

    # Clean up the route
    app_with_db.routes[:] = [
        r for r in app_with_db.routes if getattr(r, "path", None) != "/test-no-auth"
    ]


@pytest.mark.asyncio
async def test_protected_endpoint_accepts_valid_token(app_with_db, db_session):
    """When AUTH_REQUIRED=true, a valid Bearer token grants access."""
    from fastapi import Depends

    from app.middleware.auth import get_current_user
    from app.services.auth_service import create_user

    # Create a user directly
    user = await create_user(db_session, "auth@example.com", "Auth User", "pass123")
    await db_session.commit()

    token = create_access_token(user.id)

    @app_with_db.get("/test-valid-token")
    async def valid_token_route(current_user=Depends(get_current_user)):
        return {"user_id": str(current_user.id), "email": current_user.email}

    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        with patch("app.middleware.auth.settings") as mock_settings:
            mock_settings.auth_required = True
            mock_settings.jwt_secret = "change-me-in-production"

            resp = await c.get(
                "/test-valid-token",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["email"] == "auth@example.com"

    # Clean up
    app_with_db.routes[:] = [
        r for r in app_with_db.routes if getattr(r, "path", None) != "/test-valid-token"
    ]
