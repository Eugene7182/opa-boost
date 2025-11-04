"""Application configuration settings.

Provides settings for database, security, CORS and feature flags.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, BaseSettings, Field


class Settings(BaseSettings):
    """Pydantic settings for application configuration."""

    project_name: str = Field(default="OPPO KZ Data Platform")
    secret_key: str = Field(..., description="Application secret key used for JWT and signing.")
    database_url: str = Field(..., description="Database connection string for PostgreSQL.")
    cors_origins: List[AnyHttpUrl] = Field(default_factory=list)
    access_token_expire_minutes: int = Field(default=60)
    refresh_token_expire_minutes: int = Field(default=60 * 24 * 7)

    # Feature flags
    enable_ai: bool = Field(default=False, alias="ENABLE_AI")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""

    return Settings()  # type: ignore[arg-type]


settings = get_settings()
