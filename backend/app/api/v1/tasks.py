"""Tasks and messages API."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.tasks import MessageCreate, MessageRead, TaskCreate, TaskRead
from app.services import tasks as tasks_service

router = APIRouter()


@router.post("", response_model=TaskRead, dependencies=[Depends(require_roles(UserRole.OFFICE, UserRole.SUPERVISOR))])
async def create_task(payload: TaskCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = tasks_service.create_task(db, payload, creator_id=str(user.id))
    return TaskRead.model_validate(task)


@router.post("/messages", response_model=MessageRead)
async def create_message(payload: MessageCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    message = tasks_service.create_message(db, payload, creator_id=str(user.id))
    return MessageRead.model_validate(message)
