import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Index, Text, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.associations import bookmark_tags
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.tag import Tag


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, server_default=text("gen_random_uuid()")
    )
    url: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    title: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    favicon_url: Mapped[str | None] = mapped_column(Text)
    og_image_url: Mapped[str | None] = mapped_column(Text)
    domain: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    is_starred: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    tags: Mapped[list["Tag"]] = relationship(
        secondary=bookmark_tags, back_populates="bookmarks"
    )

    __table_args__ = (
        Index("idx_bookmarks_domain", "domain"),
        Index("idx_bookmarks_created_at", "created_at"),
        # Partial index: only non-deleted rows, matching §4. Keeps the index
        # small since every list query filters is_deleted = false.
        Index(
            "idx_bookmarks_is_deleted",
            "is_deleted",
            postgresql_where=text("is_deleted = false"),
        ),
    )
