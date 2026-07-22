from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import ResourceUpdate, ResourceResponse
from app.services.task_service import ResourceTaskService
from app.core.logger import logger
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.put("/{task_id}", response_model=ResourceResponse)
def update_task(task_id: int, task_in: ResourceUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Updates the resource properties. Handles checking/unchecking completion checkbox,
    updating notes Markdown, and incrementing revision counts.
    Automatically recalculates XP and triggers streak updating.
    """
    resource = ResourceTaskService.get_resource(db, task_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {task_id} not found."
        )
        
    if not resource.day or not resource.day.module or not resource.day.module.track or not resource.day.module.track.goal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resource has corrupt or missing goal references."
        )
    goal = resource.day.module.track.goal
    if goal.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this resource."
        )
        
    task = ResourceTaskService.update_resource(db, task_id, task_in)
    return task
