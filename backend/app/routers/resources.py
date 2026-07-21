from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Goal
from app.services.resource_service import ResourceService
from app.api.dependencies import get_current_user
from typing import Dict, List, Any, Optional

router = APIRouter(prefix="/resources", tags=["Resources"])

from pydantic import BaseModel, Field
from app.models.models import Track, Module, Day, Resource as DBResource, Goal as DBGoal

class CustomResourceCreate(BaseModel):
    title: str
    category: str = "Video"
    platform: str = "YouTube"
    difficulty: str = "Medium"
    external_url: Optional[str] = None
    estimated_time_mins: int = 30
    notes: Optional[str] = None
    goal_id: Optional[int] = None

@router.get("/")
def get_all_resources(
    goal_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns resources catalog. If goal_id is provided and represents a custom non-tech goal,
    dynamically loads resources aligned to that goal using AI.
    Always includes uploaded PDFs as resource cards.
    """
    if goal_id:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if goal:
            return ResourceService.get_resources_for_goal(
                goal_title=goal.title, db=db, user_id=current_user["id"]
            )
            
    return ResourceService.get_all_resources()

@router.post("/custom")
def add_custom_resource(
    res_in: CustomResourceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Allows user to add their own custom resource (video, book, article, code repo) to their active goal.
    """
    goal_id = res_in.goal_id
    if not goal_id:
        active_goal = db.query(DBGoal).filter(DBGoal.user_id == current_user["id"]).order_by(DBGoal.created_at.desc()).first()
        if not active_goal:
            raise HTTPException(status_code=400, detail="No active goal found. Please create a goal first.")
        goal_id = active_goal.id

    goal = db.query(DBGoal).filter(DBGoal.id == goal_id, DBGoal.user_id == current_user["id"]).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    # Find or create a day to attach the resource
    day = (
        db.query(Day)
        .join(Module, Day.module_id == Module.id)
        .join(Track, Module.track_id == Track.id)
        .filter(Track.goal_id == goal.id)
        .first()
    )

    if not day:
        # Create a default Track -> Module -> Day
        track = Track(goal_id=goal.id, title="Custom Study Resources", description="User added custom learning materials", order=99)
        db.add(track)
        db.flush()
        module = Module(track_id=track.id, title="Personal Library", description="Custom items", order=1)
        db.add(module)
        db.flush()
        day = Day(module_id=module.id, day_number=1, title="User Custom Resources", unlocked=True)
        db.add(day)
        db.flush()

    url = res_in.external_url or ResourceService.build_external_url(res_in.title, res_in.category, res_in.platform, goal.title)

    new_res = DBResource(
        day_id=day.id,
        title=res_in.title,
        category=res_in.category,
        platform=res_in.platform,
        difficulty=res_in.difficulty,
        estimated_duration_mins=res_in.estimated_time_mins,
        external_url=url,
        notes=res_in.notes or "",
        is_completed=False,
        xp_reward=15
    )
    db.add(new_res)
    db.commit()
    db.refresh(new_res)

    return {
        "id": new_res.id,
        "title": new_res.title,
        "category": new_res.category,
        "platform": new_res.platform,
        "difficulty": new_res.difficulty,
        "estimated_time_mins": new_res.estimated_duration_mins,
        "external_url": new_res.external_url,
        "is_completed": new_res.is_completed,
        "notes": new_res.notes,
        "xp_reward": new_res.xp_reward
    }
