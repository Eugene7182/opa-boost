"""Task and message service layer."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.communication import ChatMessage, Task
from app.schemas.tasks import MessageCreate, TaskCreate


def create_task(db: Session, payload: TaskCreate, creator_id: str) -> Task:
    """Create task for given audience."""

    task = Task(
        title=payload.title,
        description=payload.description,
        audience_roles=",".join(payload.roles),
        network_id=payload.network_id,
        region_id=payload.region_id,
        store_id=payload.store_id,
        created_by=creator_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def list_tasks(db: Session) -> list[Task]:
    """Return tasks."""

    return db.execute(select(Task)).scalars().all()


def create_message(db: Session, payload: MessageCreate, creator_id: str) -> ChatMessage:
    """Broadcast a message."""

    message = ChatMessage(
        content=payload.content,
        roles=",".join(payload.roles),
        network_id=payload.network_id,
        region_id=payload.region_id,
        store_id=payload.store_id,
        created_by=creator_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def list_messages(db: Session) -> list[ChatMessage]:
    """Return messages."""

    return db.execute(select(ChatMessage)).scalars().all()
