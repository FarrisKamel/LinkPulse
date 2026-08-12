from typing import Annotated
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.models import Bookmark
from app.schemas import BookmarkCreate, BookmarkRead
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
