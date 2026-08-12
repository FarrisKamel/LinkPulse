from fastapi import FastAPI

from app.routers import bookmarks

app = FastAPI(title="LinkPulse API")

app.include_router(bookmarks.router)


@app.get("/api/health")
async def health() -> dict[str, str]:
    """Liveness probe. LP-2 acceptance: returns {"status": "ok"}."""
    return {"status": "ok"}
