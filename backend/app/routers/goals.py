from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import GoalCreate, GoalResponse, GoalUpdate, AnalyticsDashboard, BadgeResponse
from app.services.goal_service import GoalService
from app.services.roadmap_service import RoadmapService
from app.services.study_service import StudyService
from app.models.models import Badge
from app.core.logger import logger
from typing import List, Optional

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(goal_in: GoalCreate, db: Session = Depends(get_db)):
    """
    Step 1 of Wizard Onboarding. Creates the goal and immediately
    generates the learning tracks, milestones, days, and tasks.
    """
    try:
        # Create Goal profile
        goal = GoalService.create_goal(db, goal_in)
        
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
def get_active_goal(db: Session = Depends(get_db)):
    """
    Returns the current active goal configuration.
    Used by frontend to check if user should be redirected to Wizard.
    """
    goal = GoalService.get_active_goal(db)
    return goal

@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = GoalService.get_goal(db, goal_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found."
        )
    return goal

@router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    success = GoalService.delete_goal(db, goal_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found."
        )
    return {"message": "Goal and related roadmap data successfully deleted."}

@router.get("/{goal_id}/analytics", response_model=AnalyticsDashboard)
def get_goal_analytics(goal_id: int, db: Session = Depends(get_db)):
    analytics = StudyService.get_analytics(db, goal_id)
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found for analytics."
        )
    return analytics

@router.get("/{goal_id}/badges", response_model=List[BadgeResponse])
def get_goal_badges(goal_id: int, db: Session = Depends(get_db)):
    goal = GoalService.get_goal(db, goal_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found."
        )
    return db.query(Badge).filter(Badge.goal_id == goal_id).order_by(Badge.unlocked_at.desc()).all()
