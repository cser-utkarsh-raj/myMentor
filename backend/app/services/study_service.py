from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from app.models.models import Goal, StudySession, DailyStatistic, Resource, Day, Module, Track, Badge
from app.schemas.schemas import StudySessionCreate, AnalyticsDashboard
from app.core.logger import logger
from typing import List, Dict, Any, Optional

class StudyService:
    @staticmethod
    def log_study_session(db: Session, session_in: StudySessionCreate) -> StudySession:
        logger.info(f"Logging study session of {session_in.duration_seconds} seconds for Goal ID {session_in.goal_id}.")
        
        db_session = StudySession(
            goal_id=session_in.goal_id,
            resource_id=session_in.resource_id,
            started_at=session_in.started_at or datetime.utcnow(),
            end_time=session_in.end_time or datetime.utcnow(),
            duration_seconds=session_in.duration_seconds,
            platform=session_in.platform,
            completion_status=session_in.completion_status,
            difficulty_rating=session_in.difficulty_rating,
            notes=session_in.notes
        )
        db.add(db_session)
        
        hours = session_in.duration_seconds / 3600.0
        from app.services.task_service import ResourceTaskService
        # Only log completion if it was successful during the session
        resources_completed = 1 if session_in.completion_status else 0
        ResourceTaskService._log_daily_stats(db, session_in.goal_id, hours_studied=hours, resources_completed=resources_completed)
        
        db.commit()
        db.refresh(db_session)
        return db_session

    @staticmethod
    def get_analytics(db: Session, goal_id: int) -> Optional[AnalyticsDashboard]:
        logger.info(f"Generating analytics dashboard for Goal ID {goal_id}.")
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            logger.warning(f"Goal ID {goal_id} not found for analytics.")
            return None

        # 1. Resources Completion Metrics
        resources_query = db.query(Resource).join(Resource.day).join(Day.module).join(Module.track).filter(
            Track.goal_id == goal_id
        )
        
        total_resources = resources_query.count()
        completed_resources = resources_query.filter(Resource.is_completed == True).count()
        
        overall_progress = (completed_resources / total_resources * 100) if total_resources > 0 else 0.0

        # 2. Hours Studied
        total_hours = db.query(func.sum(DailyStatistic.hours_studied)).filter(
            DailyStatistic.goal_id == goal_id
        ).scalar() or 0.0

        # 3. Time calculations
        elapsed_days = (date.today() - goal.created_at.date()).days
        days_remaining = max(0, goal.timeline_days - elapsed_days)

        # 4. Streak badges
        badges_count = db.query(Badge).filter(Badge.goal_id == goal_id).count()

        # 5. Category completion
        all_resources = resources_query.all()
        category_totals: Dict[str, int] = {}
        category_completed: Dict[str, int] = {}
        category_revisions: Dict[str, int] = {}

        for res in all_resources:
            cat = res.category
            category_totals[cat] = category_totals.get(cat, 0) + 1
            if res.is_completed:
                category_completed[cat] = category_completed.get(cat, 0) + 1
            category_revisions[cat] = category_revisions.get(cat, 0) + res.revision_count

        category_progress = {}
        for cat, total in category_totals.items():
            completed = category_completed.get(cat, 0)
            category_progress[cat] = round((completed / total) * 100, 1)

        weakest = None
        min_rate = 101.0
        for cat, rate in category_progress.items():
            if rate < min_rate:
                min_rate = rate
                weakest = cat

        most_revised = None
        max_revisions = -1
        for cat, revs in category_revisions.items():
            if revs > max_revisions and revs > 0:
                max_revisions = revs
                most_revised = cat

        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        weekly_hours = []
        for i in range(7):
            day_date = start_of_week + timedelta(days=i)
            day_stats = db.query(DailyStatistic).filter(
                DailyStatistic.goal_id == goal_id,
                DailyStatistic.date == day_date
            ).first()
            weekly_hours.append(day_stats.hours_studied if day_stats else 0.0)

        stats_history = db.query(DailyStatistic).filter(
            DailyStatistic.goal_id == goal_id
        ).all()
        
        heatmap_data = []
        for stat in stats_history:
            heatmap_data.append({
                "date": stat.date.isoformat(),
                "count": stat.tasks_completed,
                "xp": stat.xp_gained,
                "hours": round(stat.hours_studied, 2)
            })

        # Calculate daily score for today
        today_stats = db.query(DailyStatistic).filter(
            DailyStatistic.goal_id == goal_id,
            DailyStatistic.date == today
        ).first()
        daily_score = 0.0
        if today_stats:
            # Score algorithm based on study hours, completion, and XP
            base = min(100, today_stats.hours_studied / goal.daily_hours * 50 if goal.daily_hours > 0 else 0)
            completion_bonus = min(30, today_stats.tasks_completed * 10)
            xp_bonus = min(20, today_stats.xp_gained / 50 * 20)
            daily_score = round(base + completion_bonus + xp_bonus, 1)
            today_stats.consistency_score = daily_score
            db.commit()

        # Calculate Recovery Recommendation
        recovery_rec = False
        if goal.last_active_date:
            days_since_active = (today - goal.last_active_date).days
            if days_since_active >= 2:
                recovery_rec = True

        # Calculate Checkpoint / Module Completion
        last_comp_module = None
        checkpoint_celebrate = False
        
        # Get all modules for this goal
        modules = db.query(Module).join(Module.track).filter(Track.goal_id == goal_id).all()
        for mod in modules:
            # Check if all resources in all days of this module are completed
            all_days = db.query(Day).filter(Day.module_id == mod.id).all()
            if not all_days:
                continue
            
            all_completed = True
            for d in all_days:
                if not d.is_completed:
                    all_completed = False
                    break
            
            if all_completed:
                last_comp_module = mod.title
                # If completed recently (within today/yesterday), recommend celebration
                checkpoint_celebrate = True

        return AnalyticsDashboard(
            overall_progress_percent=round(overall_progress, 1),
            total_hours_studied=round(total_hours, 2),
            total_resources_completed=completed_resources,
            current_streak=goal.streak,
            longest_streak=goal.longest_streak,
            days_remaining=days_remaining,
            xp=goal.xp,
            daily_score=daily_score,
            streak_badges_count=badges_count,
            category_progress=category_progress,
            weekly_study_hours=weekly_hours,
            heatmap=heatmap_data,
            weakest_topic=weakest,
            most_revised_topic=most_revised,
            recovery_recommended=recovery_rec,
            checkpoint_celebration=checkpoint_celebrate,
            last_completed_module=last_comp_module
        )
