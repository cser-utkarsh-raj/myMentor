from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Dict, Any

class OrmModel(BaseModel):
    class Config:
        from_attributes = True

# RESOURCES
class ResourceBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    platform: str
    difficulty: str = "Medium"
    estimated_duration_mins: int = 30
    external_url: Optional[str] = None
    xp_reward: int = 10
    tags: Optional[str] = None
    is_completed: bool = False

ResourceCreate = ResourceBase

class ResourceUpdate(BaseModel):
    is_completed: Optional[bool] = None
    notes: Optional[str] = None
    revision_count: Optional[int] = None

class ResourceResponse(ResourceBase, OrmModel):
    id: int
    day_id: int
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    revision_count: int

# DAYS
class DayBase(BaseModel):
    day_number: int
    title: str
    unlocked: bool = False
    is_completed: bool = False
    xp_rewarded: bool = False

DayCreate = DayBase

class DayResponse(DayBase, OrmModel):
    id: int
    module_id: int
    resources: List[ResourceResponse] = []

# MODULES
class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0

ModuleCreate = ModuleBase

class ModuleResponse(ModuleBase, OrmModel):
    id: int
    track_id: int
    days: List[DayResponse] = []

# TRACKS
class TrackBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0

TrackCreate = TrackBase

class TrackResponse(TrackBase, OrmModel):
    id: int
    goal_id: int
    modules: List[ModuleResponse] = []

# GOALS
class GoalBase(BaseModel):
    title: str
    target: Optional[str] = None
    active_mode: str = "Learning"
    daily_hours: float = 3.0
    timeline_days: int = 45

GoalCreate = GoalBase

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target: Optional[str] = None
    active_mode: Optional[str] = None
    daily_hours: Optional[float] = None
    timeline_days: Optional[int] = None
    xp: Optional[int] = None
    streak: Optional[int] = None
    longest_streak: Optional[int] = None
    last_active_date: Optional[date] = None

class GoalResponse(GoalBase, OrmModel):
    id: int
    xp: int
    streak: int
    longest_streak: int
    last_active_date: Optional[date] = None
    created_at: datetime
    tracks: List[TrackResponse] = []

# STUDY SESSIONS
class StudySessionBase(BaseModel):
    duration_seconds: int
    platform: Optional[str] = None
    completion_status: bool = False
    difficulty_rating: Optional[str] = None
    notes: Optional[str] = None

class StudySessionCreate(StudySessionBase):
    goal_id: int
    resource_id: Optional[int] = None
    started_at: Optional[datetime] = None
    end_time: Optional[datetime] = None

class StudySessionResponse(StudySessionBase, OrmModel):
    id: int
    goal_id: int
    resource_id: Optional[int] = None
    started_at: datetime
    end_time: Optional[datetime] = None

# STATS & BADGES
class DailyStatisticResponse(OrmModel):
    id: int
    goal_id: int
    date: date
    hours_studied: float
    tasks_completed: int
    xp_gained: int
    consistency_score: float

class BadgeResponse(OrmModel):
    id: int
    goal_id: int
    title: str
    description: str
    icon_name: str
    unlocked_at: datetime

# PDF SCHEMAS
class PDFBase(BaseModel):
    filename: str
    size_bytes: int
    category: str
    tags: Optional[str] = None
    is_archived: bool = False

class PDFCreate(PDFBase):
    file_path: str

class PDFUpdate(BaseModel):
    filename: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    is_archived: Optional[bool] = None

class PDFResponse(PDFBase, OrmModel):
    id: int
    file_path: str
    upload_date: datetime
    extraction_status: Optional[str] = None

# ANALYTICS
class AnalyticsDashboard(BaseModel):
    overall_progress_percent: float
    total_hours_studied: float
    total_resources_completed: int
    current_streak: int
    longest_streak: int
    days_remaining: int
    xp: int
    daily_score: float
    streak_badges_count: int
    category_progress: dict
    weekly_study_hours: List[float]
    heatmap: List[dict]
    weakest_topic: Optional[str] = None
    most_revised_topic: Optional[str] = None
    recovery_recommended: Optional[bool] = False
    checkpoint_celebration: Optional[bool] = False
    last_completed_module: Optional[str] = None
