from httpx import AsyncClient


async def test_create_and_list_tags(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/tags", json={"name": "python", "color": "#3572A5"}
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "python"

    listing = await client.get("/api/tags")
    assert listing.status_code == 200
    tags = listing.json()
    assert len(tags) == 1
    assert tags[0]["name"] == "python"
    assert tags[0]["bookmark_count"] == 0


async def test_blank_tag_name_rejected(client: AsyncClient) -> None:
    resp = await client.post("/api/tags", json={"name": "   "})
    assert resp.status_code == 422


async def test_create_duplicate_tag_returns_409(client: AsyncClient) -> None:
    await client.post("/api/tags", json={"name": "dup"})
    resp = await client.post("/api/tags", json={"name": "dup"})
    assert resp.status_code == 409


async def test_bookmark_count_reflects_usage(client: AsyncClient) -> None:
    await client.post(
        "/api/bookmarks", json={"url": "https://x.test", "tags": ["react"]}
    )
    listing = await client.get("/api/tags")
    tag = next(t for t in listing.json() if t["name"] == "react")
    assert tag["bookmark_count"] == 1


async def test_rename_tag(client: AsyncClient) -> None:
    created = (await client.post("/api/tags", json={"name": "old"})).json()
    resp = await client.patch(f"/api/tags/{created['id']}", json={"name": "new"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "new"


async def test_rename_to_existing_name_returns_409(client: AsyncClient) -> None:
    await client.post("/api/tags", json={"name": "a"})
    b = (await client.post("/api/tags", json={"name": "b"})).json()
    resp = await client.patch(f"/api/tags/{b['id']}", json={"name": "a"})
    assert resp.status_code == 409


async def test_delete_tag(client: AsyncClient) -> None:
    created = (await client.post("/api/tags", json={"name": "gone"})).json()
    resp = await client.delete(f"/api/tags/{created['id']}")
    assert resp.status_code == 204
    listing = await client.get("/api/tags")
    assert all(t["name"] != "gone" for t in listing.json())


async def test_update_missing_tag_returns_404(client: AsyncClient) -> None:
    resp = await client.patch(
        "/api/tags/00000000-0000-0000-0000-000000000000", json={"name": "x"}
    )
    assert resp.status_code == 404
