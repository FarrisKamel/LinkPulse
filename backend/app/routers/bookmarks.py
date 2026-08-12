from typing import Annotated
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import ColumnElement, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.models import Bookmark, Tag
from app.schemas import BookmarkCreate, BookmarkList, BookmarkRead, SortField
from app.services.metadata import MetadataFetcher, get_metadata_fetcher

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])

# Reusable dependency-injected types (the modern FastAPI style — no call in a
# default argument, so no bugbear B008). LP-6/LP-7 will reuse these.
SessionDep = Annotated[AsyncSession, Depends(get_session)]
FetcherDep = Annotated[MetadataFetcher, Depends(get_metadata_fetcher)]

_DUPLICATE_DETAIL = "A bookmark with this URL already exists"


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
    loaded = await session.scalar(
        select(Bookmark)
        .where(Bookmark.id == bookmark.id)
        .options(selectinload(Bookmark.tags))
    )
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
        .order_by(order)
        .limit(limit)
        .offset(offset)
    )

    items = [BookmarkRead.model_validate(b) for b in rows.all()]
    return BookmarkList(items=items, total=total or 0, limit=limit, offset=offset)
