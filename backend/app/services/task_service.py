from sqlalchemy.orm import Session
from datetime import datetime, date
from app.models.models import Resource, Day, Goal, DailyStatistic, Module, Track
from app.schemas.schemas import ResourceUpdate
from app.services.goal_service import GoalService
from app.core.logger import logger
from typing import Optional

class ResourceTaskService:
    @staticmethod
    def get_resource(db: Session, resource_id: int) -> Optional[Resource]:
        return db.query(Resource).filter(Resource.id == resource_id).first()

    @staticmethod
    def update_resource(db: Session, resource_id: int, resource_in: ResourceUpdate) -> Optional[Resource]:
        logger.info(f"Updating resource ID: {resource_id}")
        db_resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not db_resource:
            logger.warning(f"Resource with ID {resource_id} not found.")
            return None

        # Fetch parent day & goal to update XP/streaks
        db_day = db.query(Day).filter(Day.id == db_resource.day_id).first()
        db_module = db_day.module if db_day else None
        db_track = db_module.track if db_module else None
        db_goal = db.query(Goal).filter(Goal.id == db_track.goal_id).first() if db_track else None

        # Handle completion state changes
        if resource_in.is_completed is not None and resource_in.is_completed != db_resource.is_completed:
            db_resource.is_completed = resource_in.is_completed
            
            if db_resource.is_completed:
                db_resource.completed_at = datetime.utcnow()
                
                if db_goal:
                    db_goal.xp += db_resource.xp_reward
                    logger.info(f"Awarded +{db_resource.xp_reward} XP to Goal ID {db_goal.id} for resource completion.")
                    ResourceTaskService._log_daily_stats(db, db_goal.id, xp_gained=db_resource.xp_reward, resources_completed=1)
                    GoalService.update_streak(db, db_goal.id)
            else:
                db_resource.completed_at = None
                
                if db_goal:
                    db_goal.xp = max(0, db_goal.xp - db_resource.xp_reward)
                    logger.info(f"Deducted {db_resource.xp_reward} XP from Goal ID {db_goal.id} for resource uncheck.")
                    ResourceTaskService._log_daily_stats(db, db_goal.id, xp_gained=-db_resource.xp_reward, resources_completed=-1)

            db.flush()
            
            if db_day and db_goal:
                ResourceTaskService._update_day_completion_status(db, db_day, db_goal)

        if resource_in.notes is not None:
            db_resource.notes = resource_in.notes

        if resource_in.revision_count is not None:
            db_resource.revision_count = resource_in.revision_count

        db.commit()
        db.refresh(db_resource)
        return db_resource

    @staticmethod
    def _update_day_completion_status(db: Session, day: Day, goal: Goal):
        total_resources = len(day.resources)
        completed_resources = sum(1 for r in day.resources if r.is_completed)
        
        is_now_completed = (total_resources > 0 and completed_resources == total_resources)
        
        if is_now_completed and not day.is_completed:
            day.is_completed = True
            
            if not day.xp_rewarded:
                goal.xp += 100
                day.xp_rewarded = True
                ResourceTaskService._log_daily_stats(db, goal.id, xp_gained=100, resources_completed=0)
                
            next_day = db.query(Day).filter(
                Day.module_id == day.module_id,
                Day.day_number == day.day_number + 1
            ).first()
            
            if not next_day:
                all_days = db.query(Day).join(Day.module).join(Module.track).filter(
                    Track.goal_id == goal.id
                ).order_by(Day.day_number.asc()).all()
                
                for idx, d in enumerate(all_days):
                    if d.id == day.id and idx + 1 < len(all_days):
                        next_day = all_days[idx + 1]
                        break
                        
            if next_day and not next_day.unlocked:
                next_day.unlocked = True
                
        elif not is_now_completed and day.is_completed:
            day.is_completed = False
            
            if day.xp_rewarded:
                goal.xp = max(0, goal.xp - 100)
                day.xp_rewarded = False
                ResourceTaskService._log_daily_stats(db, goal.id, xp_gained=-100, resources_completed=0)
                
        db.flush()

    @staticmethod
    def _log_daily_stats(db: Session, goal_id: int, xp_gained: int = 0, resources_completed: int = 0, hours_studied: float = 0.0):
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
                xp_gained=0,
                consistency_score=100.0
            )
            db.add(stats)
            db.flush()
            
        stats.xp_gained += xp_gained
        stats.tasks_completed += resources_completed
        stats.hours_studied += hours_studied
        
        stats.xp_gained = max(0, stats.xp_gained)
        stats.tasks_completed = max(0, stats.tasks_completed)
        stats.hours_studied = max(0.0, stats.hours_studied)
        db.flush()
