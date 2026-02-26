"""Shared fixtures for end-to-end integration tests.

Uses an async in-memory SQLite database for the User model (registration/login)
and mocks transaction/subscription services to avoid PostgreSQL-only column types
(e.g. ARRAY(String) on the Transaction model).
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import StaticPool, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.main import app
from app.models.user import User

TEST_DATABASE_URL = "sqlite+aiosqlite://"


@pytest_asyncio.fixture
async def db_engine():
    """Create a fresh async in-memory SQLite engine for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # Only create the users table — Transaction/RecurringGroup use
    # PostgreSQL-only types (ARRAY, pg UUID) that SQLite cannot handle.
    async with engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: User.__table__.create(sync_conn, checkfirst=True)
        )

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: User.__table__.drop(sync_conn, checkfirst=True)
        )
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    """Provide an async session bound to the in-memory engine."""
    session_factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session


@pytest.fixture
def app_with_db(db_session):
    """Return the real FastAPI app with the DB dependency overridden."""

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
    """AsyncClient bound to the test app for HTTP calls."""
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def registered_user(client):
    """Register a user and return the response data (including id)."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "e2e@vault.test",
            "name": "E2E Test User",
            "password": "securepassword123",
            "currency": "NZD",
        },
    )
    assert response.status_code == 201
    return response.json()
