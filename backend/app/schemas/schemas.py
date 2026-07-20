from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Optional

# ==========================================
# TASK SCHEMAS
# ==========================================
class TaskBase(BaseModel):
    title: str
    category: str
    difficulty: str = "Medium"
    is_completed: bool = False
    estimated_time_mins: int = 30

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    is_completed: Optional[bool] = None
    notes: Optional[str] = None
    revision_count: Optional[int] = None
    completed_time_mins: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    day_id: int
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    revision_count: int
    completed_time_mins: Optional[int] = None

    class Config:
        from_attributes = True

# ==========================================
# DAY SCHEMAS
# ==========================================
class DayBase(BaseModel):
    day_number: int
    title: str
    unlocked: bool = False
    is_completed: bool = False
    xp_rewarded: bool = False

class DayCreate(DayBase):
    pass

class DayResponse(DayBase):
    id: int
    milestone_id: int
    tasks: List[TaskResponse] = []

    class Config:
        from_attributes = True

# ==========================================
# MILESTONE SCHEMAS
# ==========================================
class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneResponse(MilestoneBase):
    id: int
    track_id: int
    days: List[DayResponse] = []

    class Config:
        from_attributes = True

# ==========================================
# TRACK SCHEMAS
# ==========================================
class TrackBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0

class TrackCreate(TrackBase):
    pass

class TrackResponse(TrackBase):
    id: int
    goal_id: int
    milestones: List[MilestoneResponse] = []

    class Config:
        from_attributes = True

# ==========================================
# GOAL SCHEMAS
# ==========================================
class GoalBase(BaseModel):
    title: str
    target: Optional[str] = None
    daily_hours: float = 3.0
    timeline_days: int = 45

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target: Optional[str] = None
    daily_hours: Optional[float] = None
    timeline_days: Optional[int] = None
    xp: Optional[int] = None
    streak: Optional[int] = None
    longest_streak: Optional[int] = None
    last_active_date: Optional[date] = None

class GoalResponse(GoalBase):
    id: int
    xp: int
    streak: int
    longest_streak: int
    last_active_date: Optional[date] = None
    created_at: datetime
    tracks: List[TrackResponse] = []

    class Config:
        from_attributes = True

# ==========================================
# STUDY SESSION SCHEMAS
# ==========================================
class StudySessionBase(BaseModel):
    duration_seconds: int
    completed: bool = True

class StudySessionCreate(StudySessionBase):
    goal_id: int
    started_at: Optional[datetime] = None

class StudySessionResponse(StudySessionBase):
    id: int
    goal_id: int
    started_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# STATISTICS SCHEMAS
# ==========================================
class DailyStatisticResponse(BaseModel):
    id: int
    goal_id: int
    date: date
    hours_studied: float
    tasks_completed: int
    xp_gained: int

    class Config:
        from_attributes = True

# ==========================================
# BADGE SCHEMAS
# ==========================================
class BadgeResponse(BaseModel):
    id: int
    goal_id: int
    title: str
    description: str
    icon_name: str
    unlocked_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# PDF SCHEMAS
# ==========================================
class PDFBase(BaseModel):
    filename: str
    size_bytes: int
    category: str

class PDFCreate(PDFBase):
    file_path: str

class PDFResponse(PDFBase):
    id: int
    file_path: str
    upload_date: datetime

    class Config:
        from_attributes = True

# ==========================================
# GENERAL ANALYTICS SCHEMAS
# ==========================================
class AnalyticsDashboard(BaseModel):
    overall_progress_percent: float
    total_hours_studied: float
    total_questions_completed: int
    current_streak: int
    longest_streak: int
    days_remaining: int
    xp: int
    streak_badges_count: int
    category_progress: dict  # Category (e.g., Python) -> completion percentage
    weekly_study_hours: List[float] # Mon-Sun hours for current week
    heatmap: List[dict]  # List of {date: str, count: int} for the calendar grid
    weakest_topic: Optional[str] = None
    most_revised_topic: Optional[str] = None
