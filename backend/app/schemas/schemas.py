from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Optional

# ==========================================
# RESOURCE SCHEMAS (Replaces Task)
# ==========================================
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

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    is_completed: Optional[bool] = None
    notes: Optional[str] = None
    revision_count: Optional[int] = None

class ResourceResponse(ResourceBase):
    id: int
    day_id: int
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    revision_count: int

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
    module_id: int
    resources: List[ResourceResponse] = []

    class Config:
        from_attributes = True

# ==========================================
# MODULE SCHEMAS
# ==========================================
class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0

class ModuleCreate(ModuleBase):
    pass

class ModuleResponse(ModuleBase):
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
    modules: List[ModuleResponse] = []

    class Config:
        from_attributes = True

# ==========================================
# GOAL SCHEMAS
# ==========================================
class GoalBase(BaseModel):
    title: str
    target: Optional[str] = None
    active_mode: str = "Learning"
    daily_hours: float = 3.0
    timeline_days: int = 45

class GoalCreate(GoalBase):
    pass

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
    platform: Optional[str] = None
    completion_status: bool = False
    difficulty_rating: Optional[str] = None
    notes: Optional[str] = None

class StudySessionCreate(StudySessionBase):
    goal_id: int
    resource_id: Optional[int] = None
    started_at: Optional[datetime] = None
    end_time: Optional[datetime] = None

class StudySessionResponse(StudySessionBase):
    id: int
    goal_id: int
    resource_id: Optional[int] = None
    started_at: datetime
    end_time: Optional[datetime] = None

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
    tasks_completed: int  # represents resources completed
    xp_gained: int
    consistency_score: float

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
    tags: Optional[str] = None
    is_archived: bool = False

class PDFCreate(PDFBase):
    file_path: str

class PDFUpdate(BaseModel):
    filename: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    is_archived: Optional[bool] = None

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
