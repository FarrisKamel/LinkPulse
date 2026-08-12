import uuid
from typing import Annotated
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import ColumnElement, func, or_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.models import Bookmark, Tag
from app.schemas import (
    BookmarkCreate,
    BookmarkList,
    BookmarkRead,
    BookmarkUpdate,
    SortField,
)
from app.services.metadata import MetadataFetcher, get_metadata_fetcher

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])

# Reusable dependency-injected types (the modern FastAPI style — no call in a
# default argument, so no bugbear B008). LP-6/LP-7 will reuse these.
SessionDep = Annotated[AsyncSession, Depends(get_session)]
FetcherDep = Annotated[MetadataFetcher, Depends(get_metadata_fetcher)]

_DUPLICATE_DETAIL = "A bookmark with this URL already exists"
_NOT_FOUND_DETAIL = "Bookmark not found"


async def _load_with_tags(
    session: AsyncSession,
    bookmark_id: uuid.UUID,
    *,
    include_deleted: bool = False,
) -> Bookmark | None:
    """Load one bookmark with its tags eagerly loaded (so response
    serialization never triggers an async-unsafe lazy load). Soft-deleted rows
    are excluded unless include_deleted is set."""
    stmt = (
        select(Bookmark)
        .where(Bookmark.id == bookmark_id)
        .options(selectinload(Bookmark.tags))
    )
    if not include_deleted:
        stmt = stmt.where(Bookmark.is_deleted.is_(False))
    result: Bookmark | None = await session.scalar(stmt)
    return result


async def _resolve_tags(session: AsyncSession, names: list[str]) -> list[Tag]:
    """Map tag names to Tag rows, creating any that don't exist yet.

    Uses INSERT ... ON CONFLICT DO NOTHING so concurrent requests introducing
    the same new tag can't collide on the unique(name) constraint (Greptile P1,
    PR #9). Order preserved; blanks and duplicates dropped."""
    cleaned = list(dict.fromkeys(n.strip() for n in names if n.strip()))
    if not cleaned:
        return []

    # Atomic get-or-create: rows that already exist are skipped, not errored.
    await session.execute(
        pg_insert(Tag)
        .values([{"name": name} for name in cleaned])
        .on_conflict_do_nothing(index_elements=["name"])
    )
    rows = await session.scalars(select(Tag).where(Tag.name.in_(cleaned)))
    by_name = {tag.name: tag for tag in rows}
    return [by_name[name] for name in cleaned]


@router.post("", response_model=BookmarkRead, status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    payload: BookmarkCreate,
    session: SessionDep,
    fetcher: FetcherDep,
) -> Bookmark:
    url = str(payload.url)

    # Friendly duplicate check. The unique constraint below is the real
    # guarantee; this just returns a clean 409 in the common case.
    existing = await session.scalar(select(Bookmark).where(Bookmark.url == url))
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, _DUPLICATE_DETAIL)

    # Scrape metadata. On any failure this returns empty fields, so the
    # bookmark is still saved with just its URL + domain.
    meta = await fetcher.fetch(url)

    bookmark = Bookmark(
        url=url,
        domain=urlparse(url).netloc or None,
        title=meta.title,
        description=meta.description,
        og_image_url=meta.og_image_url,
        favicon_url=meta.favicon_url,
    )
    session.add(bookmark)
    try:
        await session.commit()
    except IntegrityError as exc:
        # Lost a race on the unique(url) constraint.
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, _DUPLICATE_DETAIL) from exc

    # Reload with tags eagerly loaded so response serialization doesn't trigger
    # an (async-unsafe) lazy load. A new bookmark simply has an empty tag list.
    loaded = await _load_with_tags(session, bookmark.id)
    assert loaded is not None  # just-committed row is guaranteed present
    return loaded


@router.get("", response_model=BookmarkList)
async def list_bookmarks(
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    starred: Annotated[bool | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
    tag: Annotated[str | None, Query()] = None,
    sort: SortField = SortField.created_at,
) -> BookmarkList:
    # Filters applied identically to the count and the page query so they
    # never disagree. Soft-deleted rows are always excluded.
    conditions: list[ColumnElement[bool]] = [Bookmark.is_deleted.is_(False)]
    if starred is not None:
        conditions.append(Bookmark.is_starred.is_(starred))
    if search:
        like = f"%{search}%"
        conditions.append(
            or_(Bookmark.title.ilike(like), Bookmark.description.ilike(like))
        )
    if tag:
        # EXISTS subquery — no explicit join to complicate the count query.
        conditions.append(Bookmark.tags.any(Tag.name == tag))

    total = await session.scalar(
        select(func.count()).select_from(Bookmark).where(*conditions)
    )

    order = (
        Bookmark.title.asc()
        if sort is SortField.title
        else Bookmark.created_at.desc()
    )
    rows = await session.scalars(
        select(Bookmark)
        .where(*conditions)
        .options(selectinload(Bookmark.tags))
        # id is a unique tiebreaker: without it, rows sharing a title/created_at
        # have undefined relative order, so offset paging could skip or repeat
        # them across pages. (Greptile P1, PR #8.)
        .order_by(order, Bookmark.id.asc())
        .limit(limit)
        .offset(offset)
    )

    items = [BookmarkRead.model_validate(b) for b in rows.all()]
    return BookmarkList(items=items, total=total or 0, limit=limit, offset=offset)


@router.get("/{bookmark_id}", response_model=BookmarkRead)
async def get_bookmark(bookmark_id: uuid.UUID, session: SessionDep) -> Bookmark:
    bookmark = await _load_with_tags(session, bookmark_id)
    if bookmark is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, _NOT_FOUND_DETAIL)
    return bookmark


@router.patch("/{bookmark_id}", response_model=BookmarkRead)
async def update_bookmark(
    bookmark_id: uuid.UUID,
    payload: BookmarkUpdate,
    session: SessionDep,
) -> Bookmark:
    bookmark = await _load_with_tags(session, bookmark_id)
    if bookmark is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, _NOT_FOUND_DETAIL)

    # Only fields the client actually sent are present here. `notes` may be set
    # to null (nullable column); null is_starred/tags are treated as no-ops.
    data = payload.model_dump(exclude_unset=True)
    if "notes" in data:
        bookmark.notes = data["notes"]
    if data.get("is_starred") is not None:
        bookmark.is_starred = data["is_starred"]
    if data.get("tags") is not None:
        # Replace strategy: the given names become the full tag set.
        bookmark.tags = await _resolve_tags(session, data["tags"])

    await session.commit()
    loaded = await _load_with_tags(session, bookmark_id)
    assert loaded is not None
    return loaded


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(bookmark_id: uuid.UUID, session: SessionDep) -> None:
    # Soft delete: flip the flag rather than removing the row.
    bookmark = await session.scalar(
        select(Bookmark).where(
            Bookmark.id == bookmark_id, Bookmark.is_deleted.is_(False)
        )
    )
    if bookmark is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, _NOT_FOUND_DETAIL)
    bookmark.is_deleted = True
    await session.commit()
