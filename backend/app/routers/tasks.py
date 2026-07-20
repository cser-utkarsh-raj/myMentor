from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import ResourceUpdate, ResourceResponse
from app.services.task_service import ResourceTaskService
from app.core.logger import logger

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.put("/{task_id}", response_model=ResourceResponse)
def update_task(task_id: int, task_in: ResourceUpdate, db: Session = Depends(get_db)):
    """
    Updates the resource properties. Handles checking/unchecking completion checkbox,
    updating notes Markdown, and incrementing revision counts.
    Automatically recalculates XP and triggers streak updating.
    """
    task = ResourceTaskService.update_resource(db, task_id, task_in)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {task_id} not found."
        )
    return task
