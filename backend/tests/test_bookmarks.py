from datetime import UTC, datetime
from urllib.parse import urlparse

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models import Bookmark, Tag
from app.services.metadata import PageMetadata, get_metadata_fetcher


class _EmptyFetcher:
    """Fetcher that returns no metadata — simulates an unreachable URL."""

    async def fetch(self, url: str) -> PageMetadata:
        return PageMetadata()


async def _seed(
    session: AsyncSession,
    url: str,
    *,
    title: str | None = None,
    description: str | None = None,
    is_starred: bool = False,
    is_deleted: bool = False,
    created_at: datetime | None = None,
    tags: list[str] | None = None,
) -> Bookmark:
    bookmark = Bookmark(
        url=url,
        domain=urlparse(url).netloc,
        title=title,
        description=description,
        is_starred=is_starred,
        is_deleted=is_deleted,
    )
    if created_at is not None:
        bookmark.created_at = created_at
    if tags:
        bookmark.tags = [Tag(name=name) for name in tags]
    session.add(bookmark)
    await session.commit()
    return bookmark


# --- POST /api/bookmarks ---------------------------------------------------


async def test_create_returns_scraped_metadata(client: AsyncClient) -> None:
    resp = await client.post("/api/bookmarks", json={"url": "https://example.com"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["url"] == "https://example.com/"
    assert body["title"] == "Fake Title"
    assert body["description"] == "A fake description"
    assert body["og_image_url"] == "https://img.test/cover.png"
    assert body["domain"] == "example.com"
    assert body["tags"] == []


async def test_create_duplicate_returns_409(client: AsyncClient) -> None:
    await client.post("/api/bookmarks", json={"url": "https://dup.test"})
    resp = await client.post("/api/bookmarks", json={"url": "https://dup.test"})
    assert resp.status_code == 409


async def test_create_unreachable_saves_url_only(client: AsyncClient) -> None:
    app.dependency_overrides[get_metadata_fetcher] = lambda: _EmptyFetcher()
    resp = await client.post("/api/bookmarks", json={"url": "https://nope.invalid/x"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] is None
    assert body["domain"] == "nope.invalid"


async def test_create_invalid_url_returns_422(client: AsyncClient) -> None:
    resp = await client.post("/api/bookmarks", json={"url": "not-a-url"})
    assert resp.status_code == 422


async def test_create_with_tags_attaches_them(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/bookmarks",
        json={"url": "https://tagged.test", "tags": ["red", "blue"]},
    )
    assert resp.status_code == 201
    assert {t["name"] for t in resp.json()["tags"]} == {"red", "blue"}


async def test_preview_returns_metadata_without_saving(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/bookmarks/preview", json={"url": "https://example.com"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Fake Title"  # from the fake fetcher
    assert body["domain"] == "example.com"
    # Nothing was persisted.
    listing = await client.get("/api/bookmarks")
    assert listing.json()["total"] == 0


# --- GET /api/bookmarks (list) ---------------------------------------------


async def test_list_empty(client: AsyncClient) -> None:
    resp = await client.get("/api/bookmarks")
    assert resp.status_code == 200
    assert resp.json() == {"items": [], "total": 0, "limit": 20, "offset": 0}


async def test_list_pagination_and_total(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    for i in range(3):
        await _seed(db_session, f"https://p{i}.test", title=f"P{i}")
    page1 = (await client.get("/api/bookmarks?limit=2")).json()
    assert page1["total"] == 3
    assert len(page1["items"]) == 2
    page2 = (await client.get("/api/bookmarks?limit=2&offset=2")).json()
    assert page2["total"] == 3
    assert len(page2["items"]) == 1


async def test_list_excludes_soft_deleted(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed(db_session, "https://live.test")
    await _seed(db_session, "https://gone.test", is_deleted=True)
    body = (await client.get("/api/bookmarks")).json()
    assert body["total"] == 1
    assert body["items"][0]["domain"] == "live.test"


async def test_list_filter_starred(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed(db_session, "https://star.test", is_starred=True)
    await _seed(db_session, "https://plain.test", is_starred=False)
    body = (await client.get("/api/bookmarks?starred=true")).json()
    assert body["total"] == 1
    assert body["items"][0]["domain"] == "star.test"


async def test_list_search_matches_title_or_description(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed(db_session, "https://a.test", title="Learn Python")
    await _seed(db_session, "https://b.test", description="about python too")
    await _seed(db_session, "https://c.test", title="Rust guide")
    body = (await client.get("/api/bookmarks?search=python")).json()
    assert body["total"] == 2


async def test_list_filter_by_tag(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed(db_session, "https://tagged.test", tags=["python"])
    await _seed(db_session, "https://untagged.test")
    body = (await client.get("/api/bookmarks?tag=python")).json()
    assert body["total"] == 1
    assert body["items"][0]["domain"] == "tagged.test"


async def test_list_sort_title_ascending(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed(db_session, "https://g.test", title="Gamma")
    await _seed(db_session, "https://a.test", title="Alpha")
    await _seed(db_session, "https://b.test", title="Beta")
    body = (await client.get("/api/bookmarks?sort=title")).json()
    assert [i["title"] for i in body["items"]] == ["Alpha", "Beta", "Gamma"]


async def test_list_default_sort_newest_first(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed(
        db_session, "https://old.test",
        created_at=datetime(2020, 1, 1, tzinfo=UTC),
    )
    await _seed(
        db_session, "https://new.test",
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    )
    body = (await client.get("/api/bookmarks")).json()
    assert [i["domain"] for i in body["items"]] == ["new.test", "old.test"]


# --- GET /api/bookmarks/{id} -----------------------------------------------


async def test_get_bookmark_found(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    bm = await _seed(db_session, "https://one.test", title="One")
    resp = await client.get(f"/api/bookmarks/{bm.id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "One"


async def test_get_bookmark_404_when_missing(client: AsyncClient) -> None:
    resp = await client.get("/api/bookmarks/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


async def test_get_bookmark_404_when_soft_deleted(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    bm = await _seed(db_session, "https://del.test", is_deleted=True)
    resp = await client.get(f"/api/bookmarks/{bm.id}")
    assert resp.status_code == 404


# --- PATCH /api/bookmarks/{id} ---------------------------------------------


async def test_patch_updates_notes_and_starred(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    bm = await _seed(db_session, "https://patch.test")
    resp = await client.patch(
        f"/api/bookmarks/{bm.id}", json={"notes": "hello", "is_starred": True}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["notes"] == "hello"
    assert body["is_starred"] is True


async def test_patch_replaces_tags(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    bm = await _seed(db_session, "https://rt.test", tags=["old"])
    resp = await client.patch(
        f"/api/bookmarks/{bm.id}", json={"tags": ["new", "fresh"]}
    )
    assert resp.status_code == 200
    names = {t["name"] for t in resp.json()["tags"]}
    assert names == {"new", "fresh"}  # "old" replaced


async def test_patch_partial_leaves_other_fields(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    bm = await _seed(db_session, "https://partial.test")
    await client.patch(f"/api/bookmarks/{bm.id}", json={"notes": "keep me"})
    resp = await client.patch(
        f"/api/bookmarks/{bm.id}", json={"is_starred": True}
    )
    body = resp.json()
    assert body["is_starred"] is True
    assert body["notes"] == "keep me"  # untouched by the second patch


async def test_patch_404_when_missing(client: AsyncClient) -> None:
    resp = await client.patch(
        "/api/bookmarks/00000000-0000-0000-0000-000000000000",
        json={"is_starred": True},
    )
    assert resp.status_code == 404


# --- DELETE /api/bookmarks/{id} --------------------------------------------


async def test_delete_soft_deletes(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    bm = await _seed(db_session, "https://kill.test")
    resp = await client.delete(f"/api/bookmarks/{bm.id}")
    assert resp.status_code == 204
    assert (await client.get(f"/api/bookmarks/{bm.id}")).status_code == 404
    assert (await client.get("/api/bookmarks")).json()["total"] == 0


async def test_delete_404_when_missing(client: AsyncClient) -> None:
    resp = await client.delete(
        "/api/bookmarks/00000000-0000-0000-0000-000000000000"
    )
    assert resp.status_code == 404
