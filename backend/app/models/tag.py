import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Text, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.associations import bookmark_tags
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.bookmark import Bookmark


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    color: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("'#6366f1'")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    bookmarks: Mapped[list["Bookmark"]] = relationship(
        secondary=bookmark_tags, back_populates="tags"
    )
