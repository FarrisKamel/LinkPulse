import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, HttpUrl


class TagRead(BaseModel):
    """A tag as returned in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    color: str


class BookmarkCreate(BaseModel):
    """Request body for POST /api/bookmarks.

    HttpUrl validates the string is a real http(s) URL — invalid input is
    rejected with a 422 before any handler code runs.
    """

    url: HttpUrl


class BookmarkRead(BaseModel):
    """A bookmark as returned in API responses.

    from_attributes=True lets FastAPI build this straight from the SQLAlchemy
    Bookmark ORM object (its `tags` relationship must be loaded first).
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    url: str
    title: str | None
    description: str | None
    favicon_url: str | None
    og_image_url: str | None
    domain: str | None
    notes: str | None
    is_starred: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    tags: list[TagRead] = []


class SortField(Enum):
    """Allowed sort options for the bookmark list. An out-of-range value is
    rejected with a 422 automatically. Plain Enum (not str-based) so the member
    named `title` doesn't collide with str.title()."""

    created_at = "created_at"  # newest first (default)
    title = "title"  # A→Z


class BookmarkList(BaseModel):
    """Paginated envelope for GET /api/bookmarks. `total` counts all matching
    bookmarks ignoring limit/offset — what the UI needs for page controls."""

    items: list[BookmarkRead]
    total: int
    limit: int
    offset: int
