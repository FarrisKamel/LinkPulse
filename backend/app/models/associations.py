from sqlalchemy import Column, ForeignKey, Table

from app.models.base import Base

# Many-to-many join between bookmarks and tags. A plain Core Table (not a
# model class) since it carries no columns of its own beyond the two FKs.
# ondelete="CASCADE" mirrors the §4 schema: deleting a bookmark or tag
# removes its join rows automatically.
bookmark_tags = Table(
    "bookmark_tags",
    Base.metadata,
    Column(
        "bookmark_id",
        ForeignKey("bookmarks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
