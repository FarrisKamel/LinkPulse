import os
from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.db import get_session
from app.main import app
from app.models import Base
from app.services.metadata import PageMetadata, get_metadata_fetcher

# In CI, DATABASE_URL points at the linkpulse_test service. Locally it defaults
# to a linkpulse_test database on the dev Postgres — never the dev database, so
# tests can freely drop/recreate tables without touching real data.
TEST_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://linkpulse:linkpulse@localhost:5432/linkpulse_test",
)


class FakeFetcher:
    """Test double for MetadataFetcher: returns canned metadata, never touches
    the network. This is the F-1 seam paying off — the whole suite is offline
    and deterministic."""

    def __init__(self, meta: PageMetadata | None = None) -> None:
        self._meta = meta or PageMetadata(
            title="Fake Title",
            description="A fake description",
            og_image_url="https://img.test/cover.png",
            favicon_url="https://img.test/favicon.ico",
        )

    async def fetch(self, url: str) -> PageMetadata:
        return self._meta


@pytest_asyncio.fixture
async def engine() -> AsyncGenerator[AsyncEngine, None]:
    """A fresh schema per test: drop + create all tables, so tests never leak
    state into one another."""
    eng = create_async_engine(TEST_DATABASE_URL)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    """A session for arranging state directly (seeding rows) in tests."""
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(engine: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    """An HTTP client driving the real app, with the DB session and the
    metadata fetcher overridden to the test DB and a fake fetcher."""
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    # Zero-arg factory: handing FastAPI the class directly would make it
    # introspect FakeFetcher.__init__ and treat `meta` as a request field.
    app.dependency_overrides[get_metadata_fetcher] = lambda: FakeFetcher()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
