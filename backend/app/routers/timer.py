from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import StudySessionCreate, StudySessionResponse
from app.services.study_service import StudyService
from app.services.goal_service import GoalService
from app.core.logger import logger
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/study-sessions", tags=["Study Sessions"])

@router.post("/", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
def log_study_session(
    session_in: StudySessionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Logs a completed study session (Pomodoro timer blocks of 25, 45, 60, or 90 mins).
    Automatically increments daily logged study hours in statistics.
    """
    goal = GoalService.get_goal(db, session_in.goal_id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {session_in.goal_id} not found."
        )
    if goal.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to log sessions for this goal."
        )
        
    try:
        session = StudyService.log_study_session(db, session_in)
        return session
    except Exception as e:
        logger.error(f"Error logging study session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
