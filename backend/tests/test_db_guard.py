import pytest
from conftest import _require_test_db


def test_accepts_database_named_test() -> None:
    url = "postgresql+asyncpg://u:p@localhost:5432/linkpulse_test"
    assert _require_test_db(url) == url


def test_rejects_non_test_database() -> None:
    with pytest.raises(RuntimeError, match="_test"):
        _require_test_db("postgresql+asyncpg://u:p@localhost:5432/linkpulse")
