from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from app.models.models import Goal, Badge, DailyStatistic
from app.schemas.schemas import GoalCreate, GoalUpdate
from app.core.logger import logger
from typing import List, Optional

class GoalService:
    @staticmethod
    def get_goal(db: Session, goal_id: int) -> Optional[Goal]:
        logger.info(f"Fetching goal details for ID: {goal_id}")
        return db.query(Goal).filter(Goal.id == goal_id).first()

    @staticmethod
    def list_goals(db: Session) -> List[Goal]:
        logger.info("Fetching all goals.")
        return db.query(Goal).order_by(Goal.created_at.desc()).all()

    @staticmethod
    def get_active_goal(db: Session) -> Optional[Goal]:
        logger.info("Fetching the currently active goal.")
        # For V1, the most recently created goal is active
        return db.query(Goal).order_by(Goal.created_at.desc()).first()

    @staticmethod
    def create_goal(db: Session, goal_in: GoalCreate) -> Goal:
        logger.info(f"Creating new learning goal: {goal_in.title}")
        db_goal = Goal(
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
    def update_goal(db: Session, goal_id: int, goal_in: GoalUpdate) -> Optional[Goal]:
        logger.info(f"Updating goal ID: {goal_id}")
        db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not db_goal:
            logger.warning(f"Goal with ID {goal_id} not found.")
            return None
            
        update_data = goal_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_goal, field, value)
            
        db.commit()
        db.refresh(db_goal)
        logger.info(f"Goal ID {goal_id} updated successfully.")
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
            
        if db_goal.last_active_date == yesterday or db_goal.last_active_date is None:
            # Increment streak
            db_goal.streak += 1
            logger.info(f"Streak incremented! Streak: {db_goal.streak}")
        else:
            # Streak broken, reset
            logger.info(f"Streak broken. Last active was {db_goal.last_active_date}. Resetting streak to 1.")
            db_goal.streak = 1
            
        # Update longest streak if exceeded
        if db_goal.streak > db_goal.longest_streak:
            db_goal.longest_streak = db_goal.streak
            logger.info(f"New longest streak badge achieved! Longest streak: {db_goal.longest_streak}")
            
        db_goal.last_active_date = today
        
        # Check for streak badges
        GoalService.check_and_award_streak_badges(db, db_goal)
        
        db.commit()
        db.refresh(db_goal)
        return db_goal

    @staticmethod
    def check_and_award_streak_badges(db: Session, goal: Goal):
        """
        Awards badges based on streak milestones (e.g., 1 day, 3 days, 7 days, 15 days).
        """
        streak = goal.streak
        badges_to_check = [
            (1, "First Step", "Started your learning journey by studying 1 day!", "streak-1"),
            (3, "Three's Company", "Maintained a consistent study streak for 3 days!", "streak-3"),
            (7, "Week Warrior", "Kept your learning fire burning for 7 days in a row!", "streak-7"),
            (15, "Half-Month Habit", "An unstoppable 15-day learning streak!", "streak-15"),
            (30, "Monthly Mastery", "Complete dedication. 30 days study streak!", "streak-30")
        ]
        
        for streak_threshold, title, desc, icon in badges_to_check:
            if streak >= streak_threshold:
                # Check if badge already exists
                exists = db.query(Badge).filter(
                    Badge.goal_id == goal.id,
                    Badge.icon_name == icon
                ).first()
                
                if not exists:
                    new_badge = Badge(
                        goal_id=goal.id,
                        title=title,
                        description=desc,
                        icon_name=icon,
                        unlocked_at=datetime.utcnow()
                    )
                    db.add(new_badge)
                    logger.info(f"Awarded Badge: '{title}' for streak of {streak_threshold} days!")
                    
                    # Award bonus XP for badges!
                    goal.xp += 150
