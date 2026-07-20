import unittest
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.base_class import Base
from app.models.models import Goal, Track, Module, Day, Resource
from app.services.goal_service import GoalService
from app.services.roadmap_service import RoadmapService
from app.schemas.schemas import GoalCreate

class TestRoadmapService(unittest.TestCase):
    def setUp(self):
        # Create an in-memory SQLite database
        self.engine = create_engine("sqlite:///:memory:")
        self.SessionLocal = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_create_goal_and_generate_roadmap(self):
        # 1. Create a goal
        goal_in = GoalCreate(
            title="Backend Developer",
            target="10 LPA",
            active_mode="Learning",
            daily_hours=3.0,
            timeline_days=45
        )
        goal = GoalService.create_goal(self.db, goal_in, user_id="test-user-123")
        self.assertEqual(goal.user_id, "test-user-123")
        self.assertEqual(goal.title, "Backend Developer")

        # 2. Generate roadmap
        success = RoadmapService.generate_roadmap(self.db, goal)
        self.assertTrue(success)

        # 3. Verify tracks, modules, days, and resources exist
        tracks = self.db.query(Track).filter(Track.goal_id == goal.id).all()
        self.assertGreater(len(tracks), 0)
        self.assertEqual(tracks[0].title, "Programming & Languages")
