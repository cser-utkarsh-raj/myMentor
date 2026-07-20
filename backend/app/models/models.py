from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base_class import Base

class Goal(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    target = Column(String, nullable=True)  # e.g., "10 LPA"
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
    milestones = relationship("Milestone", back_populates="track", cascade="all, delete-orphan")


class Milestone(Base):
    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, ForeignKey("track.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    # Relationships
    track = relationship("Track", back_populates="milestones")
    days = relationship("Day", back_populates="milestone", cascade="all, delete-orphan")


class Day(Base):
    id = Column(Integer, primary_key=True, index=True)
    milestone_id = Column(Integer, ForeignKey("milestone.id", ondelete="CASCADE"), nullable=False)
    day_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    unlocked = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    xp_rewarded = Column(Boolean, default=False)

    # Relationships
    milestone = relationship("Milestone", back_populates="days")
    tasks = relationship("Task", back_populates="day", cascade="all, delete-orphan")


class Task(Base):
    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("day.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # Python, DSA, SQL, etc.
    difficulty = Column(String, default="Medium")  # Easy, Medium, Hard
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    revision_count = Column(Integer, default=0)
    estimated_time_mins = Column(Integer, default=30)
    completed_time_mins = Column(Integer, nullable=True)

    # Relationships
    day = relationship("Day", back_populates="tasks")


class StudySession(Base):
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goal.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    duration_seconds = Column(Integer, nullable=False)
    completed = Column(Boolean, default=True)

    # Relationships
    goal = relationship("Goal", back_populates="study_sessions")


class DailyStatistic(Base):
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goal.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=date.today, unique=True, index=True)
    hours_studied = Column(Float, default=0.0)
    tasks_completed = Column(Integer, default=0)
    xp_gained = Column(Integer, default=0)

    # Relationships
    goal = relationship("Goal", back_populates="daily_statistics")


class Badge(Base):
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goal.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    icon_name = Column(String, nullable=False)  # Badge icon type, e.g., 'streak-7', 'complete-goal'
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    goal = relationship("Goal", back_populates="badges")


class PDF(Base):
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False, index=True)
    file_path = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    category = Column(String, nullable=False)  # Tag/Category e.g., "Resume", "DSA", "SQL"
