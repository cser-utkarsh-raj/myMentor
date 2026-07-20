from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import TaskUpdate, TaskResponse
from app.services.task_service import TaskService
from app.core.logger import logger

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    """
    Updates the task properties. Handles checking/unchecking completion checkbox,
    updating notes Markdown, and incrementing revision counts.
    Automatically recalculates XP and triggers streak updating.
    """
    task = TaskService.update_task(db, task_id, task_in)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found."
        )
    return task
