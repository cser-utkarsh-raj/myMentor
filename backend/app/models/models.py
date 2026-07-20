from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.base_class import Base

class Goal(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False, index=True)
    target = Column(String, nullable=True)  # e.g., "10 LPA"
    active_mode = Column(String, default="Learning")  # Learning, Practice, Revision, Interview
    daily_hours = Column(Float, default=3.0)
    timeline_days = Column(Integer, default=45)
    xp = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tracks = relationship("Track", back_populates="goal", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="goal", cascade="all, delete-orphan")
    daily_statistics = relationship("DailyStatistic", back_populates="goal", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="goal", cascade="all, delete-orphan")


class Track(Base):
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goal.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    # Relationships
    goal = relationship("Goal", back_populates="tracks")
    modules = relationship("Module", back_populates="track", cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "module"
    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, ForeignKey("track.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    # Relationships
    track = relationship("Track", back_populates="modules")
    days = relationship("Day", back_populates="module", cascade="all, delete-orphan")


class Day(Base):
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("module.id", ondelete="CASCADE"), nullable=False)
    day_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    unlocked = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    xp_rewarded = Column(Boolean, default=False)

    # Relationships
    module = relationship("Module", back_populates="days")
    resources = relationship("Resource", back_populates="day", cascade="all, delete-orphan")


class Resource(Base):
    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("day.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)  # Theory, Exercise, Video
    platform = Column(String, nullable=False)  # LeetCode, YouTube, GitHub, PDF, Internal
    difficulty = Column(String, default="Medium")  # Easy, Medium, Hard
    estimated_duration_mins = Column(Integer, default=30)
    external_url = Column(String, nullable=True)
    xp_reward = Column(Integer, default=10)
    tags = Column(String, nullable=True)  # comma separated
    
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    revision_count = Column(Integer, default=0)

    # Relationships
    day = relationship("Day", back_populates="resources")
    study_sessions = relationship("StudySession", back_populates="resource")


class StudySession(Base):
    __tablename__ = "studysession"
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goal.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resource.id", ondelete="SET NULL"), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    platform = Column(String, nullable=True)
    completion_status = Column(Boolean, default=False)
    difficulty_rating = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    goal = relationship("Goal", back_populates="study_sessions")
    resource = relationship("Resource", back_populates="study_sessions")


class DailyStatistic(Base):
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goal.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=date.today, index=True)
    hours_studied = Column(Float, default=0.0)
    tasks_completed = Column(Integer, default=0)  # Maps to resources completed
    xp_gained = Column(Integer, default=0)
    consistency_score = Column(Float, default=0.0) # Daily score metric

    __table_args__ = (UniqueConstraint('goal_id', 'date', name='_goal_date_uc'),)

    # Relationships
    goal = relationship("Goal", back_populates="daily_statistics")


class Badge(Base):
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goal.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    icon_name = Column(String, nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    goal = relationship("Goal", back_populates="badges")


class PDF(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    filename = Column(String, nullable=False, index=True)
    file_path = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    category = Column(String, nullable=False)
    tags = Column(String, nullable=True)
    is_archived = Column(Boolean, default=False)
