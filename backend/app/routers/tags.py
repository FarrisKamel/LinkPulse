import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Bookmark, Tag, bookmark_tags
from app.schemas import TagCreate, TagRead, TagUpdate, TagWithCount

router = APIRouter(prefix="/api/tags", tags=["tags"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]

_DUPLICATE = "A tag with this name already exists"
_NOT_FOUND = "Tag not found"


@router.get("", response_model=list[TagWithCount])
async def list_tags(session: SessionDep) -> list[TagWithCount]:
    # Count only non-deleted bookmarks per tag; tags with none report 0.
    stmt = (
        select(Tag, func.count(Bookmark.id))
        .outerjoin(bookmark_tags, bookmark_tags.c.tag_id == Tag.id)
        .outerjoin(
            Bookmark,
            (Bookmark.id == bookmark_tags.c.bookmark_id)
            & (Bookmark.is_deleted.is_(False)),
        )
        .group_by(Tag.id)
        .order_by(Tag.name.asc())
    )
    rows = await session.execute(stmt)
    return [
        TagWithCount(id=tag.id, name=tag.name, color=tag.color, bookmark_count=count)
        for tag, count in rows.all()
    ]


@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
async def create_tag(payload: TagCreate, session: SessionDep) -> Tag:
    tag = Tag(name=payload.name.strip(), color=payload.color)
    session.add(tag)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, _DUPLICATE) from exc
    await session.refresh(tag)
    return tag


@router.patch("/{tag_id}", response_model=TagRead)
async def update_tag(
    tag_id: uuid.UUID,
    payload: TagUpdate,
    session: SessionDep,
) -> Tag:
    tag = await session.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, _NOT_FOUND)

    data = payload.model_dump(exclude_unset=True)
    if data.get("name") is not None:
        tag.name = data["name"].strip()
    if data.get("color") is not None:
        tag.color = data["color"]

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, _DUPLICATE) from exc
    await session.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: uuid.UUID, session: SessionDep) -> None:
    tag = await session.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, _NOT_FOUND)
    # bookmark_tags rows cascade via the FK's ON DELETE CASCADE.
    await session.delete(tag)
    await session.commit()
