from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Declarative base. All models inherit from this, and
    Base.metadata is what Alembic diffs against to autogenerate migrations.
    """
