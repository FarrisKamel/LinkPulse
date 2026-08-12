from httpx import AsyncClient


async def test_stats_empty(client: AsyncClient) -> None:
    resp = await client.get("/api/stats")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_bookmarks"] == 0
    assert body["total_tags"] == 0
    assert body["bookmarks_this_week"] == 0
    assert body["top_domains"] == []
    assert body["tag_distribution"] == []


async def test_stats_with_data(client: AsyncClient) -> None:
    await client.post(
        "/api/bookmarks", json={"url": "https://a.test/1", "tags": ["x"]}
    )
    await client.post("/api/bookmarks", json={"url": "https://a.test/2"})
    await client.post("/api/bookmarks", json={"url": "https://b.test/1"})

    body = (await client.get("/api/stats")).json()
    assert body["total_bookmarks"] == 3
    assert body["total_tags"] == 1
    assert body["bookmarks_this_week"] == 3

    domains = {d["domain"]: d["count"] for d in body["top_domains"]}
    assert domains["a.test"] == 2
    assert domains["b.test"] == 1

    tags = {t["name"]: t["count"] for t in body["tag_distribution"]}
    assert tags["x"] == 1

    assert len(body["bookmarks_over_time"]) >= 1
