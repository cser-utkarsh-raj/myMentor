from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import StudySessionCreate, StudySessionResponse
from app.services.study_service import StudyService
from app.core.logger import logger

router = APIRouter(prefix="/timer", tags=["Timer"])

@router.post("/sessions", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
def log_study_session(session_in: StudySessionCreate, db: Session = Depends(get_db)):
    """
    Logs a completed study session (Pomodoro timer blocks of 25, 45, 60, or 90 mins).
    Automatically increments daily logged study hours in statistics.
    """
    try:
        session = StudyService.log_study_session(db, session_in)
        return session
    except Exception as e:
        logger.error(f"Error logging study session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
