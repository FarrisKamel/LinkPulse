from fastapi import FastAPI

from app.config import settings
from app.routers import bookmarks, tags

app = FastAPI(title="LinkPulse API")

app.include_router(bookmarks.router)
app.include_router(tags.router)

# Test-only DB reset endpoint, mounted only when explicitly enabled.
if settings.testing:
    from app.routers import testing

    app.include_router(testing.router)


@app.get("/api/health")
async def health() -> dict[str, str]:
    """Liveness probe. LP-2 acceptance: returns {"status": "ok"}."""
    return {"status": "ok"}
