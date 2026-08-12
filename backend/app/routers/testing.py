from fastapi import APIRouter, status
from sqlalchemy import text

from app.routers.bookmarks import SessionDep

router = APIRouter(prefix="/api/_test", tags=["testing"])


@router.post("/reset", status_code=status.HTTP_204_NO_CONTENT)
async def reset_database(session: SessionDep) -> None:
    """Truncate all tables for a clean E2E slate. This router is only mounted
    when settings.testing is true, so it never exists in production."""
    await session.execute(
        text("TRUNCATE bookmarks, tags, bookmark_tags RESTART IDENTITY CASCADE")
    )
    await session.commit()
