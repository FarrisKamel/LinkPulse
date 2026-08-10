from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

# One engine (connection pool) for the whole app. The asyncpg driver is
# selected by the postgresql+asyncpg:// scheme in DATABASE_URL.
engine = create_async_engine(settings.database_url, echo=False)

# Factory for per-request sessions. expire_on_commit=False keeps ORM objects
# usable after commit (the default would expire them and trigger lazy reloads,
# which don't play well with async).
SessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields one session per request, always closed.

    Endpoints depend on this; tests override it to point at a test database.
    """
    async with SessionLocal() as session:
        yield session
