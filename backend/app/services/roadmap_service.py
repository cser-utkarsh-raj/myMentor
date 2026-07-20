import os
import json
from sqlalchemy.orm import Session
from app.models.models import Goal, Track, Milestone, Day, Task
from app.core.config import settings
from app.core.logger import logger
from typing import Dict, Any, List

class RoadmapService:
    @staticmethod
    def generate_roadmap(db: Session, goal: Goal) -> bool:
        """
        Loads the rule-based roadmap JSON matching the goal title,
        scales its content to fit `timeline_days` days, and saves it
        to the database as a set of Tracks, Milestones, Days, and Tasks.
        """
        logger.info(f"Starting roadmap generation for Goal ID: {goal.id} ({goal.title})")
        
        # 1. Map goal title to resource filename
        filename = "custom_goal.json"
        title_lower = goal.title.lower()
        
        if "backend" in title_lower:
            filename = "backend_developer.json"
        elif "python" in title_lower:
            filename = "learn_python.json"
        
        # Feel free to add more mappings here
        
        resource_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources", "roadmaps", filename)
        
        # Fallback if file doesn't exist
        if not os.path.exists(resource_path):
            logger.warning(f"Roadmap configuration not found at {resource_path}. Falling back to custom_goal.json")
            resource_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources", "roadmaps", "custom_goal.json")
            
        try:
            with open(resource_path, "r", encoding="utf-8") as f:
                template = json.load(f)
        except Exception as e:
            logger.error(f"Failed to read roadmap template: {e}")
            return False

        # 2. Extract steps to distribute
        # Collect all steps in a flat list with their parent structures
        flat_steps = []
        for track_idx, track_temp in enumerate(template.get("tracks", [])):
            for milestone_idx, milestone_temp in enumerate(track_temp.get("milestones", [])):
                for step_idx, step_temp in enumerate(milestone_temp.get("steps", [])):
                    flat_steps.append({
                        "track_title": track_temp.get("title"),
                        "track_desc": track_temp.get("description"),
                        "track_order": track_temp.get("order", track_idx + 1),
                        "milestone_title": milestone_temp.get("title"),
                        "milestone_desc": milestone_temp.get("description"),
                        "milestone_order": milestone_temp.get("order", milestone_idx + 1),
                        "step_title": step_temp.get("title"),
                        "tasks": step_temp.get("tasks", [])
                    })

        total_steps = len(flat_steps)
        if total_steps == 0:
            logger.error("No steps found in roadmap template. Aborting generation.")
            return False

        logger.info(f"Found {total_steps} steps in template. Distributing across {goal.timeline_days} days.")

        # 3. Create relational database structures
        db_tracks: Dict[str, Track] = {}
        db_milestones: Dict[str, Milestone] = {}
        
        # Calculate timeline day allocations for each step.
        # Step i gets allocated days from day_start to day_end
        N = goal.timeline_days
        
        for i, step_info in enumerate(flat_steps):
            # Calculate range of days for this step
            day_start = int(round(i * N / total_steps)) + 1
            day_end = int(round((i + 1) * N / total_steps))
            allocated_days_count = day_end - day_start + 1
            
            # Get or create Track
            track_title = step_info["track_title"]
            if track_title not in db_tracks:
                track = Track(
                    goal_id=goal.id,
                    title=track_title,
                    description=step_info["track_desc"],
                    order=step_info["track_order"]
                )
                db.add(track)
                db.flush()  # Get track.id
                db_tracks[track_title] = track
            track_id = db_tracks[track_title].id

            # Get or create Milestone
            milestone_key = f"{track_title}::{step_info['milestone_title']}"
            if milestone_key not in db_milestones:
                milestone = Milestone(
                    track_id=track_id,
                    title=step_info["milestone_title"],
                    description=step_info["milestone_desc"],
                    order=step_info["milestone_order"]
                )
                db.add(milestone)
                db.flush()  # Get milestone.id
                db_milestones[milestone_key] = milestone
            milestone_id = db_milestones[milestone_key].id

            # Generate Day(s) for this step
            tasks_list = step_info["tasks"]
            tasks_count = len(tasks_list)
            
            for day_idx in range(allocated_days_count):
                day_num = day_start + day_idx
                
                # Make day title descriptive
                if allocated_days_count > 1:
                    day_title = f"{step_info['step_title']} (Part {day_idx + 1}/{allocated_days_count})"
                else:
                    day_title = step_info["step_title"]
                
                # First day is unlocked, others are locked initially
                is_unlocked = (day_num == 1)
                
                db_day = Day(
                    milestone_id=milestone_id,
                    day_number=day_num,
                    title=day_title,
                    unlocked=is_unlocked,
                    is_completed=False,
                    xp_rewarded=False
                )
                db.add(db_day)
                db.flush()  # Get db_day.id

                # Distribute tasks across the days allocated to this step
                # Calculate sub-slice of tasks for this day
                if tasks_count > 0:
                    t_start = int(round(day_idx * tasks_count / allocated_days_count))
                    t_end = int(round((day_idx + 1) * tasks_count / allocated_days_count))
                    day_tasks = tasks_list[t_start:t_end]
                    
                    for t_item in day_tasks:
                        task = Task(
                            day_id=db_day.id,
                            title=t_item.get("title"),
                            category=t_item.get("category"),
                            difficulty=t_item.get("difficulty", "Medium"),
                            is_completed=False,
                            notes=t_item.get("notes", ""),
                            revision_count=0,
                            estimated_time_mins=t_item.get("estimated_time_mins", 30),
                            completed_time_mins=None
                        )
                        db.add(task)
                
                # Fallback: if no tasks are assigned to this day, create a review/practice task
                if tasks_count == 0 or (t_end - t_start == 0):
                    task = Task(
                        day_id=db_day.id,
                        title=f"Review & Practice: {step_info['step_title']}",
                        category="Projects",
                        difficulty="Medium",
                        is_completed=False,
                        notes=f"Perform hands-on exercises and review concepts covered in {step_info['step_title']}.",
                        revision_count=0,
                        estimated_time_mins=30,
                        completed_time_mins=None
                    )
                    db.add(task)

        db.commit()
        logger.info(f"Roadmap generated successfully for Goal ID: {goal.id} ({N} Days).")
        return True

    @staticmethod
    def get_roadmap_details(db: Session, goal_id: int) -> List[Track]:
        """
        Fetches the complete tracks, milestones, days, and tasks structure for a goal.
        """
        return db.query(Track).filter(Track.goal_id == goal_id).order_by(Track.order.asc()).all()
