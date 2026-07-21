from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Goal
from app.services.resource_service import ResourceService
from typing import Dict, List, Any, Optional

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("/")
def get_all_resources(
    goal_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns resources catalog. If goal_id is provided and represents a custom non-tech goal,
    dynamically loads resources aligned to that goal using AI.
    """
    if goal_id:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if goal:
            return ResourceService.get_resources_for_goal(goal_title=goal.title)
            
    return ResourceService.get_all_resources()
