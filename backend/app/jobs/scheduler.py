"""APScheduler jobs for reminders."""
from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.schemas.tasks import TaskCreate
from app.services.tasks import create_task

scheduler = BackgroundScheduler(timezone="Asia/Almaty")


def inventory_reminder_job(db_session_factory) -> None:
    """Create weekly inventory reminder tasks."""

    session = db_session_factory()
    try:
        create_task(
            session,
            payload=TaskCreate(
                title="Обновите остатки",
                description="Пожалуйста, обновите остатки",
                roles=["promoter"],
                network_id=None,
                region_id=None,
                store_id=None,
            ),
            creator_id="system",
        )
    finally:
        session.close()


def setup_scheduler(db_session_factory) -> None:
    """Configure scheduler jobs."""

    scheduler.add_job(
        inventory_reminder_job,
        CronTrigger(day_of_week="sat", hour=9, minute=0),
        args=[db_session_factory],
        id="inventory_reminder",
        replace_existing=True,
    )
    scheduler.start()
