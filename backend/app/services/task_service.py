from sqlalchemy.orm import Session
from datetime import datetime, date
from app.models.models import Task, Day, Goal, DailyStatistic
from app.schemas.schemas import TaskUpdate
from app.services.goal_service import GoalService
from app.core.logger import logger
from typing import Optional

class TaskService:
    @staticmethod
    def get_task(db: Session, task_id: int) -> Optional[Task]:
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def update_task(db: Session, task_id: int, task_in: TaskUpdate) -> Optional[Task]:
        logger.info(f"Updating task ID: {task_id}")
        db_task = db.query(Task).filter(Task.id == task_id).first()
        if not db_task:
            logger.warning(f"Task with ID {task_id} not found.")
            return None

        # Fetch parent day & goal to update XP/streaks
        db_day = db.query(Day).filter(Day.id == db_task.day_id).first()
        db_milestone = db_day.milestone if db_day else None
        db_track = db_milestone.track if db_milestone else None
        db_goal = db.query(Goal).filter(Goal.id == db_track.goal_id).first() if db_track else None

        # Handle completion state changes
        if task_in.is_completed is not None and task_in.is_completed != db_task.is_completed:
            db_task.is_completed = task_in.is_completed
            
            if db_task.is_completed:
                db_task.completed_at = datetime.utcnow()
                db_task.completed_time_mins = task_in.completed_time_mins or db_task.estimated_time_mins
                
                # Award XP if goal exists
                if db_goal:
                    db_goal.xp += 10
                    logger.info(f"Awarded +10 XP to Goal ID {db_goal.id} for task completion.")
                    # Log in statistics
                    TaskService._log_daily_stats(db, db_goal.id, xp_gained=10, tasks_completed=1)
                    # Update streak
                    GoalService.update_streak(db, db_goal.id)
            else:
                db_task.completed_at = None
                db_task.completed_time_mins = None
                
                # Deduct XP if goal exists
                if db_goal:
                    db_goal.xp = max(0, db_goal.xp - 10)
                    logger.info(f"Deducted 10 XP from Goal ID {db_goal.id} for task uncheck.")
                    TaskService._log_daily_stats(db, db_goal.id, xp_gained=-10, tasks_completed=-1)

            db.flush()
            
            # Recalculate Day completion state
            if db_day and db_goal:
                TaskService._update_day_completion_status(db, db_day, db_goal)

        # Update notes if provided
        if task_in.notes is not None:
            db_task.notes = task_in.notes
            logger.info(f"Notes updated for Task ID {task_id}.")

        # Update revision count
        if task_in.revision_count is not None:
            db_task.revision_count = task_in.revision_count
            logger.info(f"Revision count updated to {db_task.revision_count} for Task ID {task_id}.")

        db.commit()
        db.refresh(db_task)
        return db_task

    @staticmethod
    def _update_day_completion_status(db: Session, day: Day, goal: Goal):
        """
        Recalculates day completion. If all tasks are completed:
        - Mark day as completed.
        - Award +100 XP if not already awarded.
        - Unlock the next day.
        """
        total_tasks = len(day.tasks)
        completed_tasks = sum(1 for t in day.tasks if t.is_completed)
        
        is_now_completed = (total_tasks > 0 and completed_tasks == total_tasks)
        
        if is_now_completed and not day.is_completed:
            day.is_completed = True
            logger.info(f"Day {day.day_number} is now fully completed!")
            
            # Award +100 XP
            if not day.xp_rewarded:
                goal.xp += 100
                day.xp_rewarded = True
                logger.info(f"Awarded +100 Day Completion XP to Goal ID {goal.id}.")
                TaskService._log_daily_stats(db, goal.id, xp_gained=100, tasks_completed=0)
                
            # Unlock next day
            next_day = db.query(Day).filter(
                Day.milestone_id == day.milestone_id,
                Day.day_number == day.day_number + 1
            ).first()
            
            # If not in same milestone, search across other milestones in this goal
            if not next_day:
                # Find all days for this goal and sort by day_number
                all_days = db.query(Day).join(Day.milestone).join(Milestone.track).filter(
                    Track.goal_id == goal.id
                ).order_by(Day.day_number.asc()).all()
                
                for idx, d in enumerate(all_days):
                    if d.id == day.id and idx + 1 < len(all_days):
                        next_day = all_days[idx + 1]
                        break
                        
            if next_day and not next_day.unlocked:
                next_day.unlocked = True
                logger.info(f"Unlocked Day {next_day.day_number} in roadmap.")
                
        elif not is_now_completed and day.is_completed:
            # Reverted from completed
            day.is_completed = False
            logger.info(f"Day {day.day_number} is no longer fully completed.")
            
            if day.xp_rewarded:
                goal.xp = max(0, goal.xp - 100)
                day.xp_rewarded = False
                logger.info(f"Deducted 100 Day Completion XP from Goal ID {goal.id}.")
                TaskService._log_daily_stats(db, goal.id, xp_gained=-100, tasks_completed=0)
                
        db.flush()

    @staticmethod
    def _log_daily_stats(db: Session, goal_id: int, xp_gained: int = 0, tasks_completed: int = 0, hours_studied: float = 0.0):
        """
        Helper to increment or decrement daily statistics.
        """
        today = date.today()
        stats = db.query(DailyStatistic).filter(
            DailyStatistic.goal_id == goal_id,
            DailyStatistic.date == today
        ).first()
        
        if not stats:
            stats = DailyStatistic(
                goal_id=goal_id,
                date=today,
                hours_studied=0.0,
                tasks_completed=0,
                xp_gained=0
            )
            db.add(stats)
            db.flush()
            
        stats.xp_gained += xp_gained
        stats.tasks_completed += tasks_completed
        stats.hours_studied += hours_studied
        
        # Ensure values don't go below zero
        stats.xp_gained = max(0, stats.xp_gained)
        stats.tasks_completed = max(0, stats.tasks_completed)
        stats.hours_studied = max(0.0, stats.hours_studied)
        db.flush()
