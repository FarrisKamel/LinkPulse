# Import every model so Base.metadata is fully populated when Alembic's
# env.py imports this package. Miss one here and autogenerate silently
# omits its table.
from app.models.associations import bookmark_tags
from app.models.base import Base
from app.models.bookmark import Bookmark
from app.models.tag import Tag

__all__ = ["Base", "Bookmark", "Tag", "bookmark_tags"]
