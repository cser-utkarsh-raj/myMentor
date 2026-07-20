from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from app.models.models import Goal, StudySession, DailyStatistic, Task, Day, Milestone, Track, Badge
from app.schemas.schemas import StudySessionCreate, AnalyticsDashboard
from app.core.logger import logger
from typing import List, Dict, Any, Optional

class StudyService:
    @staticmethod
    def log_study_session(db: Session, session_in: StudySessionCreate) -> StudySession:
        logger.info(f"Logging study session of {session_in.duration_seconds} seconds for Goal ID {session_in.goal_id}.")
        
        # Log study session
        db_session = StudySession(
            goal_id=session_in.goal_id,
            started_at=session_in.started_at or datetime.utcnow(),
            duration_seconds=session_in.duration_seconds,
            completed=session_in.completed
        )
        db.add(db_session)
        
        # Log study hours to DailyStatistic
        hours = session_in.duration_seconds / 3600.0
        from app.services.task_service import TaskService
        TaskService._log_daily_stats(db, session_in.goal_id, hours_studied=hours)
        
        db.commit()
        db.refresh(db_session)
        logger.info(f"Study session logged. ID: {db_session.id}")
        return db_session

    @staticmethod
    def get_analytics(db: Session, goal_id: int) -> Optional[AnalyticsDashboard]:
        logger.info(f"Generating analytics dashboard for Goal ID {goal_id}.")
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            logger.warning(f"Goal ID {goal_id} not found for analytics.")
            return None

        # 1. Tasks Completion Metrics
        tasks_query = db.query(Task).join(Task.day).join(Day.milestone).join(Milestone.track).filter(
            Track.goal_id == goal_id
        )
        
        total_tasks = tasks_query.count()
        completed_tasks = tasks_query.filter(Task.is_completed == True).count()
        
        overall_progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0

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
        all_tasks = tasks_query.all()
        category_totals: Dict[str, int] = {}
        category_completed: Dict[str, int] = {}
        category_revisions: Dict[str, int] = {}

        for task in all_tasks:
            cat = task.category
            category_totals[cat] = category_totals.get(cat, 0) + 1
            if task.is_completed:
                category_completed[cat] = category_completed.get(cat, 0) + 1
            category_revisions[cat] = category_revisions.get(cat, 0) + task.revision_count

        category_progress = {}
        for cat, total in category_totals.items():
            completed = category_completed.get(cat, 0)
            category_progress[cat] = round((completed / total) * 100, 1)

        # 6. Weakest Topic (lowest completion rate with total > 0, excluding 100%)
        weakest = None
        min_rate = 101.0
        for cat, rate in category_progress.items():
            if rate < min_rate:
                min_rate = rate
                weakest = cat

        # 7. Most Revised Topic
        most_revised = None
        max_revisions = -1
        for cat, revs in category_revisions.items():
            if revs > max_revisions and revs > 0:
                max_revisions = revs
                most_revised = cat

        # 8. Weekly hours compilation (Monday - Sunday of current week)
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())  # Monday
        weekly_hours = []
        for i in range(7):
            day_date = start_of_week + timedelta(days=i)
            day_stats = db.query(DailyStatistic).filter(
                DailyStatistic.goal_id == goal_id,
                DailyStatistic.date == day_date
            ).first()
            weekly_hours.append(day_stats.hours_studied if day_stats else 0.0)

        # 9. Contribution Grid Heatmap
        stats_history = db.query(DailyStatistic).filter(
            DailyStatistic.goal_id == goal_id
        ).all()
        
        heatmap_data = []
        for stat in stats_history:
            # We map date -> tasks_completed (or XP) for contribution count
            heatmap_data.append({
                "date": stat.date.isoformat(),
                "count": stat.tasks_completed,
                "xp": stat.xp_gained,
                "hours": round(stat.hours_studied, 2)
            })

        return AnalyticsDashboard(
            overall_progress_percent=round(overall_progress, 1),
            total_hours_studied=round(total_hours, 2),
            total_questions_completed=completed_tasks,
            current_streak=goal.streak,
            longest_streak=goal.longest_streak,
            days_remaining=days_remaining,
            xp=goal.xp,
            streak_badges_count=badges_count,
            category_progress=category_progress,
            weekly_study_hours=weekly_hours,
            heatmap=heatmap_data,
            weakest_topic=weakest,
            most_revised_topic=most_revised
        )
