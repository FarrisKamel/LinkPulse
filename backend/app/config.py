from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# The single .env lives at the repo root (one level above backend/).
# backend/app/config.py -> parents[2] == repo root.
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    """Typed application config, validated at import time.

    Reads from real environment variables first, then the repo-root .env.
    `extra="ignore"` lets POSTGRES_* (consumed by the db container, not the
    app) coexist in the same .env without tripping validation.
    """

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    database_url: str


settings = Settings()  # import-time instance; raises if DATABASE_URL is unset
