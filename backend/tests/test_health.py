from httpx import ASGITransport, AsyncClient

from app.main import app


async def test_health_returns_ok() -> None:
    """Smoke test: the health endpoint responds {"status": "ok"}.

    Drives the real ASGI app in-process via httpx's ASGITransport — no
    running server, no database needed (the health route touches neither).
    pytest-asyncio is in 'auto' mode, so this async test just runs.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/health")

    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
