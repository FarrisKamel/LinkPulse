from fastapi import FastAPI

app = FastAPI(title="LinkPulse API")


@app.get("/api/health")
async def health() -> dict[str, str]:
    """Liveness probe. LP-2 acceptance: returns {"status": "ok"}."""
    return {"status": "ok"}
