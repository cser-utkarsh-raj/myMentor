# Import all the models, so that Base has them before being
# imported by Migrations or Database Initialization systems.
from app.database.base_class import Base  # noqa
from app.models.models import Goal, Track, Module, Day, Resource, StudySession, DailyStatistic, Badge, PDF, AIMemory  # noqa
