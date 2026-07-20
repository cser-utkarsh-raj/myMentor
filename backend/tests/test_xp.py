import unittest
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.base_class import Base
from app.models.models import Goal, Track, Module, Day, Resource, Badge
from app.services.goal_service import GoalService
from app.services.task_service import ResourceTaskService
from app.schemas.schemas import ResourceUpdate

class TestXPAndBadges(unittest.TestCase):
    def setUp(self):
        # Create an in-memory SQLite database
        self.engine = create_engine("sqlite:///:memory:")
        self.SessionLocal = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_xp_award_on_task_completion(self):
        # 1. Create goal and basic models
        goal = Goal(
            user_id="test-user-456",
            title="Test Goal",
            xp=0,
            streak=0,
            longest_streak=0
        )
        self.db.add(goal)
        self.db.flush()

        track = Track(goal_id=goal.id, title="Test Track")
        self.db.add(track)
        self.db.flush()

        module = Module(track_id=track.id, title="Test Module")
        self.db.add(module)
        self.db.flush()

        day = Day(module_id=module.id, day_number=1, title="Day 1", unlocked=True)
        self.db.add(day)
        self.db.flush()

        resource = Resource(
            day_id=day.id,
            title="Test Resource",
            category="Theory",
            platform="Internal",
            difficulty="Easy",
            xp_reward=10,
            is_completed=False
        )
        self.db.add(resource)
        self.db.commit()

        # 2. Update resource to completed
        update_in = ResourceUpdate(is_completed=True)
        updated_res = ResourceTaskService.update_resource(self.db, resource.id, update_in)
        
        # 3. Verify XP was awarded (10 XP task + 100 XP day completion + 150 XP first streak badge)
        self.assertTrue(updated_res.is_completed)
        self.db.refresh(goal)
        self.assertEqual(goal.xp, 260)
