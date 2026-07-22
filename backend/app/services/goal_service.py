from sqlalchemy.orm import Session, selectinload
from datetime import datetime, date, timedelta
from app.models.models import Goal, Track, Module, Day, Badge, DailyStatistic
from app.schemas.schemas import GoalCreate, GoalUpdate
from app.core.logger import logger
from typing import List, Optional

class GoalService:
    @staticmethod
    def get_goal(db: Session, goal_id: int) -> Optional[Goal]:
        logger.info(f"Fetching goal details for ID: {goal_id}")
        return db.query(Goal).options(
            selectinload(Goal.tracks)
            .selectinload(Track.modules)
            .selectinload(Module.days)
            .selectinload(Day.resources)
        ).filter(Goal.id == goal_id).first()

    @staticmethod
    def list_goals(db: Session, user_id: str) -> List[Goal]:
        logger.info(f"Fetching all goals for user: {user_id}")
        return db.query(Goal).options(
            selectinload(Goal.tracks)
            .selectinload(Track.modules)
            .selectinload(Module.days)
            .selectinload(Day.resources)
        ).filter(Goal.user_id == user_id).order_by(Goal.created_at.desc()).all()

    @staticmethod
    def get_active_goal(db: Session, user_id: str) -> Optional[Goal]:
        logger.info(f"Fetching the currently active goal for user: {user_id}")
        return db.query(Goal).options(
            selectinload(Goal.tracks)
            .selectinload(Track.modules)
            .selectinload(Module.days)
            .selectinload(Day.resources)
        ).filter(Goal.user_id == user_id).order_by(Goal.created_at.desc()).first()

    @staticmethod
    def create_goal(db: Session, goal_in: GoalCreate, user_id: str) -> Goal:
        logger.info(f"Creating new learning goal: {goal_in.title} for user: {user_id}")
        db_goal = Goal(
            user_id=user_id,
            title=goal_in.title,
            target=goal_in.target,
            active_mode=goal_in.active_mode,
            daily_hours=goal_in.daily_hours,
            timeline_days=goal_in.timeline_days,
            xp=0,
            streak=0,
            longest_streak=0,
            last_active_date=None,
            created_at=datetime.utcnow()
        )
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        logger.info(f"Goal created successfully with ID: {db_goal.id}")
        return db_goal

    @staticmethod
    def delete_goal(db: Session, goal_id: int) -> bool:
        logger.info(f"Deleting goal ID: {goal_id}")
        db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not db_goal:
            logger.warning(f"Goal with ID {goal_id} not found for deletion.")
            return False
        db.delete(db_goal)
        db.commit()
        logger.info(f"Goal ID {goal_id} and all related tracks/milestones/tasks deleted.")
        return True

    @staticmethod
    def update_streak(db: Session, goal_id: int) -> Optional[Goal]:
        """
        Updates the streak and longest streak for a goal.
        Should be called when a task is completed or hours are logged.
        """
        db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not db_goal:
            return None
            
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Check if they have already studied/completed tasks today
        if db_goal.last_active_date == today:
            logger.info(f"Streak already active for today. Current streak: {db_goal.streak}")
            return db_goal
            
        # Check if streak continues from yesterday or if it resets
        if db_goal.last_active_date == yesterday or db_goal.last_active_date is None:
            db_goal.streak += 1
        else:
            db_goal.streak = 1  # Reset streak if missed a day
            
        if db_goal.streak > db_goal.longest_streak:
            db_goal.longest_streak = db_goal.streak
            
        db_goal.last_active_date = today
        db.commit()
        db.refresh(db_goal)
        
        # Award streak badges if applicable
        GoalService.check_and_award_streak_badges(db, db_goal)
        
        return db_goal

    @staticmethod
    def update_mode(db: Session, goal_id: int, new_mode: str) -> Optional[Goal]:
        """Updates the active learning mode for a goal."""
        db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not db_goal:
            return None
            
        db_goal.active_mode = new_mode
        db.commit()
        db.refresh(db_goal)
        return db_goal

    @staticmethod
    def add_xp(db: Session, goal_id: int, amount: int) -> Optional[Goal]:
        """Adds XP to a goal."""
        db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not db_goal:
            return None
            
        db_goal.xp += amount
        db.commit()
        db.refresh(db_goal)
        return db_goal

    @staticmethod
    def check_and_award_streak_badges(db: Session, goal: Goal):
        """Checks streak milestones and awards badges."""
        streak_milestones = {
            3: ("Spark of Discipline", "Maintained a 3-day learning streak!", "Zap"),
            7: ("Unstoppable Scholar", "Maintained a 7-day learning streak!", "Flame"),
            14: ("Master of Consistency", "Maintained a 14-day learning streak!", "Award"),
            30: ("Legendary Mentor Pupil", "Maintained a 30-day learning streak!", "Crown")
        }
        
        for streak_count, (title, description, icon) in streak_milestones.items():
            if goal.streak >= streak_count:
                existing_badge = db.query(Badge).filter(
                    Badge.goal_id == goal.id,
                    Badge.title == title
                ).first()
                
                if not existing_badge:
                    badge = Badge(
                        goal_id=goal.id,
                        title=title,
                        description=description,
                        icon_name=icon,
                        unlocked_at=datetime.utcnow()
                    )
                    db.add(badge)
                    
                    # Update Daily Statistics
                    today_stat = db.query(DailyStatistic).filter(
                        DailyStatistic.goal_id == goal.id,
                        DailyStatistic.date == date.today()
                    ).first()
                    
                    if not today_stat:
                        today_stat = DailyStatistic(
                            goal_id=goal.id,
                            date=date.today(),
                            hours_spent=0.0,
                            tasks_completed=0,
                            xp_earned=50,
                            streak_count=goal.streak
                        )
                        db.add(today_stat)
                    else:
                        today_stat.xp_earned += 50
                        
                    db.commit()
