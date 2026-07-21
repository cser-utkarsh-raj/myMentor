import os
import json
from sqlalchemy.orm import Session
from app.models.models import Goal, Track, Module, Day, Resource
from app.core.config import settings
from app.core.logger import logger
from typing import Dict, Any, List

class RoadmapService:
    @staticmethod
    def generate_roadmap(db: Session, goal: Goal) -> bool:
        """
        Loads the rule-based roadmap JSON matching the goal title,
        scales its content to fit `timeline_days` days, and saves it
        to the database as a set of Tracks, Modules, Days, and Resources.
        """
        logger.info(f"Starting roadmap generation for Goal ID: {goal.id} ({goal.title})")
        
        # 1. Map goal title to resource filename
        filename = "custom_goal.json"
        title_lower = goal.title.lower()
        
        if "backend" in title_lower or "software" in title_lower or "developer" in title_lower:
            filename = "backend_developer.json"
        elif "ai & machine learning" in title_lower or "python" in title_lower:
            filename = "learn_python.json"
        elif "creative design" in title_lower or "react" in title_lower or "frontend" in title_lower:
            filename = "learn_react.json"
        elif "data science" in title_lower:
            filename = "data_science.json"
        
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
            for module_idx, module_temp in enumerate(track_temp.get("modules", track_temp.get("milestones", []))):
                for step_idx, step_temp in enumerate(module_temp.get("steps", [])):
                    flat_steps.append({
                        "track_title": track_temp.get("title"),
                        "track_desc": track_temp.get("description"),
                        "track_order": track_temp.get("order", track_idx + 1),
                        "module_title": module_temp.get("title"),
                        "module_desc": module_temp.get("description"),
                        "module_order": module_temp.get("order", module_idx + 1),
                        "step_title": step_temp.get("title"),
                        "resources": step_temp.get("resources", step_temp.get("tasks", []))
                    })

        total_steps = len(flat_steps)
        if total_steps == 0:
            logger.error("No steps found in roadmap template. Aborting generation.")
            return False

        logger.info(f"Found {total_steps} steps in template. Distributing across {goal.timeline_days} days.")

        # 3. Create relational database structures
        db_tracks: Dict[str, Track] = {}
        db_modules: Dict[str, Module] = {}
        
        # Calculate timeline day allocations for each step.
        N = goal.timeline_days
        
        for i, step_info in enumerate(flat_steps):
            day_start = int(round(i * N / total_steps)) + 1
            day_end = int(round((i + 1) * N / total_steps))
            # Ensure every step gets at least one day — never skip steps
            if day_end < day_start:
                day_end = day_start
            allocated_days_count = day_end - day_start + 1
            
            # Track
            track_title = step_info["track_title"]
            if track_title not in db_tracks:
                track = Track(
                    goal_id=goal.id,
                    title=track_title,
                    description=step_info["track_desc"],
                    order=step_info["track_order"]
                )
                db.add(track)
                db.flush()
                db_tracks[track_title] = track
            track_id = db_tracks[track_title].id

            # Module
            module_key = f"{track_title}::{step_info['module_title']}"
            if module_key not in db_modules:
                module = Module(
                    track_id=track_id,
                    title=step_info["module_title"],
                    description=step_info["module_desc"],
                    order=step_info["module_order"]
                )
                db.add(module)
                db.flush()
                db_modules[module_key] = module
            module_id = db_modules[module_key].id

            # Days
            res_list = step_info["resources"]
            res_count = len(res_list)
            
            for day_idx in range(allocated_days_count):
                day_num = day_start + day_idx
                if allocated_days_count > 1:
                    day_title = f"{step_info['step_title']} (Part {day_idx + 1}/{allocated_days_count})"
                else:
                    day_title = step_info["step_title"]
                
                is_unlocked = (day_num == 1)
                
                db_day = Day(
                    module_id=module_id,
                    day_number=day_num,
                    title=day_title,
                    unlocked=is_unlocked,
                    is_completed=False,
                    xp_rewarded=False
                )
                db.add(db_day)
                db.flush()

                if res_count > 0:
                    t_start = int(round(day_idx * res_count / allocated_days_count))
                    t_end = int(round((day_idx + 1) * res_count / allocated_days_count))
                    day_res = res_list[t_start:t_end]
                else:
                    day_res = []
                
                if len(day_res) > 0:
                    for r_item in day_res:
                        resource = Resource(
                            day_id=db_day.id,
                            title=r_item.get("title", "Resource"),
                            category=r_item.get("category", "General"),
                            platform=r_item.get("platform", "Internal"),
                            difficulty=r_item.get("difficulty", "Medium"),
                            is_completed=False,
                            notes=r_item.get("notes", ""),
                            revision_count=0,
                            estimated_duration_mins=r_item.get("estimated_time_mins", r_item.get("estimated_duration_mins", 30)),
                            completed_at=None
                        )
                        db.add(resource)
                else:
                    resource = Resource(
                        day_id=db_day.id,
                        title=f"Review: {step_info['step_title']}",
                        category="Projects",
                        platform="Internal",
                        difficulty="Medium",
                        is_completed=False,
                        notes="Perform hands-on exercises and review concepts.",
                        revision_count=0,
                        estimated_duration_mins=30,
                        completed_at=None
                    )
                    db.add(resource)

        db.commit()
        logger.info(f"Roadmap generated successfully for Goal ID: {goal.id} ({N} Days).")
        return True

    @staticmethod
    def get_roadmap_details(db: Session, goal_id: int) -> List[Track]:
        return db.query(Track).filter(Track.goal_id == goal_id).order_by(Track.order.asc()).all()
