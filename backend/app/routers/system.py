from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Goal, Track, Module, Day, Resource, StudySession, DailyStatistic, Badge
from app.core.logger import logger
from app.api.dependencies import get_current_user
import json
from datetime import datetime

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/backup", status_code=status.HTTP_200_OK)
def backup_database(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Creates a full JSON export of the current user's progress.
    Used for silent auto-backups and user exports.
    """
    try:
        goals = db.query(Goal).filter(Goal.user_id == current_user["id"]).all()
        backup_data = []
        for g in goals:
            g_data = {
                "title": g.title,
                "target": g.target,
                "active_mode": g.active_mode,
                "xp": g.xp,
                "streak": g.streak,
                "longest_streak": g.longest_streak,
                "daily_statistics": [{"date": str(s.date), "hours": s.hours_studied, "score": s.consistency_score} for s in g.daily_statistics],
                "badges": [{"title": b.title, "unlocked_at": str(b.unlocked_at)} for b in g.badges],
                "sessions": [{"started_at": str(s.started_at), "duration": s.duration_seconds} for s in g.study_sessions]
            }
            backup_data.append(g_data)
            
        logger.info(f"Auto-backup generated successfully for user: {current_user['id']}")
        return {"status": "success", "timestamp": str(datetime.utcnow()), "data": backup_data}
    except Exception as e:
        logger.error(f"Failed to generate backup: {e}")
        return {"status": "error", "message": str(e)}

from app.services.goal_library import get_categorized_goals

@router.get("/library", status_code=status.HTTP_200_OK)
def get_library():
    """
    Returns the seeded V3 goal library organized by category.
    """
    try:
        data = get_categorized_goals()
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Failed to fetch goal library: {e}")
        return {"status": "error", "message": str(e)}
