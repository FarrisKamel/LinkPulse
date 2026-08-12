from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Bookmark, Tag, bookmark_tags
from app.schemas import DateCount, DomainCount, Stats, TagCount

router = APIRouter(prefix="/api/stats", tags=["stats"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.get("", response_model=Stats)
async def get_stats(session: SessionDep) -> Stats:
    not_deleted = Bookmark.is_deleted.is_(False)
    now = datetime.now(UTC)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total_bookmarks = (
        await session.scalar(
            select(func.count()).select_from(Bookmark).where(not_deleted)
        )
    ) or 0
    total_tags = (
        await session.scalar(select(func.count()).select_from(Tag))
    ) or 0
    this_week = (
        await session.scalar(
            select(func.count())
            .select_from(Bookmark)
            .where(not_deleted, Bookmark.created_at >= week_ago)
        )
    ) or 0

    domain_rows = await session.execute(
        select(Bookmark.domain, func.count().label("c"))
        .where(not_deleted, Bookmark.domain.is_not(None))
        .group_by(Bookmark.domain)
        .order_by(desc("c"))
        .limit(10)
    )
    top_domains = [
        DomainCount(domain=domain, count=count)
        for domain, count in domain_rows.all()
        if domain is not None
    ]

    day = func.date(Bookmark.created_at)
    time_rows = await session.execute(
        select(day.label("d"), func.count().label("c"))
        .where(not_deleted, Bookmark.created_at >= month_ago)
        .group_by(day)
        .order_by(day)
    )
    bookmarks_over_time = [
        DateCount(date=str(d), count=count) for d, count in time_rows.all()
    ]

    tag_rows = await session.execute(
        select(Tag.name, Tag.color, func.count(Bookmark.id).label("c"))
        .outerjoin(bookmark_tags, bookmark_tags.c.tag_id == Tag.id)
        .outerjoin(
            Bookmark,
            (Bookmark.id == bookmark_tags.c.bookmark_id) & not_deleted,
        )
        .group_by(Tag.id)
        .order_by(desc("c"))
    )
    tag_distribution = [
        TagCount(name=name, color=color, count=count)
        for name, color, count in tag_rows.all()
    ]

    return Stats(
        total_bookmarks=total_bookmarks,
        total_tags=total_tags,
        bookmarks_this_week=this_week,
        top_domains=top_domains,
        bookmarks_over_time=bookmarks_over_time,
        tag_distribution=tag_distribution,
    )
