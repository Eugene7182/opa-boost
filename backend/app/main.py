"""FastAPI application entrypoint."""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.jobs.scheduler import setup_scheduler

logger = logging.getLogger(__name__)

app = FastAPI(title=settings.project_name, version="1.0.0")

if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def on_startup() -> None:
    """Application startup hook."""

    logger.info("Application startup complete")
    setup_scheduler(SessionLocal)


@app.get("/api/v1/health", tags=["health"])
async def health() -> dict[str, str]:
    """Return health check payload."""

    return {"status": "ok"}


@app.get("/api/v1/version", tags=["health"])
async def version() -> dict[str, str]:
    """Return application version metadata."""

    return {"version": app.version}


app.include_router(api_router, prefix="/api/v1")
