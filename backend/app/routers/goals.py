from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import GoalCreate, GoalResponse, GoalUpdate, AnalyticsDashboard, BadgeResponse
from app.services.goal_service import GoalService
from app.services.roadmap_service import RoadmapService
from app.services.study_service import StudyService
from app.models.models import Badge
from app.core.logger import logger
from app.api.dependencies import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("/", response_model=List[GoalResponse])
def get_goals(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Returns a list of all goals for the current user."""
    return GoalService.list_goals(db, user_id=current_user["id"])

@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(goal_in: GoalCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Step 1 of Wizard Onboarding. Creates the goal and immediately
    generates the learning tracks, milestones, days, and tasks.
    """
    try:
        # Create Goal profile for the current user
        goal = GoalService.create_goal(db, goal_in, user_id=current_user["id"])
        
        # Generate the scaling roadmap from JSON template
        roadmap_success = RoadmapService.generate_roadmap(db, goal)
        if not roadmap_success:
            # Cleanup goal if generation failed to maintain DB consistency
            GoalService.delete_goal(db, goal.id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Roadmap generation failed. Please check backend templates."
            )
            
        # Re-fetch with relationship mappings
        refetched_goal = GoalService.get_goal(db, goal.id)
        return refetched_goal
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in create_goal endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/active", response_model=Optional[GoalResponse])
def get_active_goal(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Returns the current active goal configuration.
    Used by frontend to check if user should be redirected to Wizard.
    """
    goal = GoalService.get_active_goal(db, user_id=current_user["id"])
    return goal

@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    goal = GoalService.get_goal(db, goal_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found."
        )
    if goal.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this goal."
        )
    return goal

@router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
def delete_goal(goal_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    goal = GoalService.get_goal(db, goal_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found."
        )
    if goal.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this goal."
        )
    success = GoalService.delete_goal(db, goal_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found."
        )
    return {"message": "Goal and related roadmap data successfully deleted."}

@router.get("/{goal_id}/analytics", response_model=AnalyticsDashboard)
def get_goal_analytics(goal_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    goal = GoalService.get_goal(db, goal_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found."
        )
    if goal.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this goal's analytics."
        )
    analytics = StudyService.get_analytics(db, goal_id)
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found for analytics."
        )
    return analytics

@router.get("/{goal_id}/badges", response_model=List[BadgeResponse])
def get_goal_badges(goal_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    goal = GoalService.get_goal(db, goal_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found."
        )
    if goal.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this goal's badges."
        )
    return db.query(Badge).filter(Badge.goal_id == goal_id).order_by(Badge.unlocked_at.desc()).all()

@router.post("/{goal_id}/recovery", response_model=GoalResponse)
def trigger_recovery_mode(goal_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Triggers Recovery Mode for a goal.
    Extends the timeline by 7 days and switches active_mode to 'Recovery'.
    This gives the user more breathing room if they fall behind.
    """
    goal = GoalService.get_goal(db, goal_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found."
        )
    if goal.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this goal."
        )
    
    # Limit recovery mode to 3 activations
    # Each activation adds 7 days, so if already extended by 21+ days beyond reasonable limits
    if goal.active_mode == "Recovery":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recovery mode is already active. You can adjust your timeline in Settings."
        )
    
    # Update goal settings
    goal.timeline_days += 7
    # Adjust daily hours slightly to reduce load (minimum 1 hour)
    goal.daily_hours = max(1.0, round(goal.daily_hours * 0.8, 1))
    goal.active_mode = "Recovery"
    
    # Refresh active date to prevent immediate double recovery recommendations
    from datetime import date
    goal.last_active_date = date.today()
    
    db.commit()
    db.refresh(goal)
    return goal

