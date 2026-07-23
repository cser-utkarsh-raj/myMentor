import os
import json
from sqlalchemy.orm import Session
from app.models.models import Goal, Track, Module, Day, Resource
from app.core.config import settings
from app.core.logger import logger
from typing import Dict, Any, List

class RoadmapService:
    @staticmethod
    def _should_include_step(step_title: str | None, module_title: str | None, timeline_days: int) -> bool:
        combined = f"{step_title or ''} {module_title or ''}".lower()
        skip_markers = ["planning phase", "initial setup", "setup & research", "define core scope", "set up practice workspace"]
        if any(marker in combined for marker in skip_markers):
            return False
        return True

    @staticmethod
    def generate_roadmap(db: Session, goal: Goal) -> bool:
        """
        Loads the rule-based roadmap JSON matching the goal title,
        scales its content to fit `timeline_days` days, and saves it
        to the database as a set of Tracks, Modules, Days, and Resources.
        """
        logger.info(f"Starting roadmap generation for Goal ID: {goal.id} ({goal.title})")
        
        # 1. Map goal title to resource template (or query AI)
        template = None
        
        from app.services.ai_service import AIService
        if AIService.is_available():
            logger.info("Gemini AI is available. Generating dynamic smart roadmap...")
            try:
                ai_roadmap = AIService.generate_smart_roadmap(
                    goal_title=goal.title,
                    target=goal.target or "None",
                    daily_hours=goal.daily_hours,
                    timeline_days=goal.timeline_days
                )
                if ai_roadmap and ai_roadmap.get("tracks"):
                    template = ai_roadmap
                    logger.info("Successfully generated roadmap using Gemini AI.")
            except Exception as e:
                logger.error(f"AI roadmap generation failed: {e}. Falling back to static templates.")

        if not template:
            # Fallback to static rule-based templates
            filename = "custom_goal.json"
            title_lower = goal.title.lower()
            
            if "full-stack" in title_lower or "fullstack" in title_lower or "full stack" in title_lower:
                filename = "fullstack_developer.json"
            elif "backend" in title_lower or "api design" in title_lower:
                filename = "backend_developer.json"
            elif "ai" in title_lower or "machine learning" in title_lower:
                filename = "ai_machine_learning.json"
            elif "python" in title_lower:
                filename = "learn_python.json"
            elif "data science" in title_lower or "data analytics" in title_lower:
                filename = "data_science.json"
            elif "devops" in title_lower or "cloud" in title_lower:
                filename = "devops_cloud.json"
            elif "cybersecurity" in title_lower or "ethical hacking" in title_lower or "security" in title_lower:
                filename = "cybersecurity.json"
            elif "ui/ux" in title_lower or "ui" in title_lower or "ux" in title_lower or "creative design" in title_lower:
                filename = "ui_ux_design.json"
            elif "product management" in title_lower or "product manager" in title_lower:
                filename = "product_management.json"
            elif "financial" in title_lower or "finance" in title_lower or "investing" in title_lower:
                filename = "finance_investing.json"
            elif "digital marketing" in title_lower or "marketing" in title_lower:
                filename = "digital_marketing.json"
            elif "spanish" in title_lower or "language" in title_lower:
                filename = "learn_spanish.json"
            
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
                    if not RoadmapService._should_include_step(
                        step_title=step_temp.get("title"),
                        module_title=module_temp.get("title"),
                        timeline_days=goal.timeline_days,
                    ):
                        logger.info(f"Skipping introductory step: {step_temp.get('title')}")
                        continue

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
                    day_title = f"{step_info['step_title']} (Day {day_idx + 1}/{allocated_days_count})"
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
                    review_variations = [
                        {"title": f"Practical Drill: {step_info['step_title']}", "category": "Exercise", "notes": f"Implement a small hands-on project or code example applying the core principles of {step_info['step_title']}."},
                        {"title": f"Deep-Dive & Edge Cases: {step_info['step_title']}", "category": "Theory", "notes": f"Read advanced reference material, articles, or documentation regarding {step_info['step_title']}."},
                        {"title": f"Active Recall Quiz: {step_info['step_title']}", "category": "Exercise", "notes": f"Set up 3 flashcards or quiz questions covering key terminology of {step_info['step_title']}."},
                        {"title": f"Study Notes Consolidation: {step_info['step_title']}", "category": "Theory", "notes": f"Summarize today's core takeaways and organize your markdown notes for {step_info['step_title']}."},
                        {"title": f"Review & Refine: {step_info['step_title']}", "category": "Projects", "notes": f"Re-read your notes, correct earlier mistakes, and cement your understanding of {step_info['step_title']}."}
                    ]
                    # Choose a variation based on the current day index in this step
                    var = review_variations[(day_idx - 1) % len(review_variations)]
                    resource = Resource(
                        day_id=db_day.id,
                        title=var["title"],
                        category=var["category"],
                        platform="Internal",
                        difficulty="Medium",
                        is_completed=False,
                        notes=var["notes"],
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

    @staticmethod
    def generate_roadmap_from_pdf_content(db: Session, goal: Goal, pdf_text: str) -> bool:
        """
        Generates a custom daily study roadmap dynamically based on an uploaded PDF's content.
        Cleans up existing tracks for the goal before saving the new PDF-based tracks.
        """
        logger.info(f"Generating PDF roadmap for Goal ID: {goal.id} using PDF content.")
        from app.services.ai_service import AIService
        
        template = None
        try:
            template = AIService.generate_roadmap_from_pdf(
                goal_title=goal.title,
                target=goal.target or "None",
                daily_hours=goal.daily_hours,
                timeline_days=goal.timeline_days,
                pdf_extracted_text=pdf_text
            )
        except Exception as e:
            logger.error(f"Failed to generate PDF roadmap via AI: {e}")
            return False

        if not template or not template.get("tracks"):
            logger.error("No tracks returned from PDF AI roadmap generation.")
            return False

        # Clear existing roadmap data for this goal
        try:
            existing_tracks = db.query(Track).filter(Track.goal_id == goal.id).all()
            for t in existing_tracks:
                db.delete(t)
            db.flush()
        except Exception as de:
            logger.error(f"Error clearing existing tracks for goal: {de}")
            db.rollback()

        # Save template to DB using same scaling logic
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
            logger.error("No steps found in PDF roadmap template.")
            return False

        db_tracks: Dict[str, Track] = {}
        db_modules: Dict[str, Module] = {}
        N = goal.timeline_days

        for i, step_info in enumerate(flat_steps):
            day_start = int(round(i * N / total_steps)) + 1
            day_end = int(round((i + 1) * N / total_steps))
            if day_end < day_start:
                day_end = day_start
            allocated_days_count = day_end - day_start + 1

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

            res_list = step_info["resources"]
            res_count = len(res_list)

            for day_idx in range(allocated_days_count):
                day_num = day_start + day_idx
                day_title = f"{step_info['step_title']} (Day {day_idx + 1}/{allocated_days_count})" if allocated_days_count > 1 else step_info["step_title"]
                
                db_day = Day(
                    module_id=module_id,
                    day_number=day_num,
                    title=day_title,
                    unlocked=(day_num == 1),
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
                            category=r_item.get("category", "Theory"),
                            platform=r_item.get("platform", "Course Material"),
                            difficulty=r_item.get("difficulty", "Medium"),
                            is_completed=False,
                            notes=r_item.get("notes", ""),
                            revision_count=0,
                            estimated_duration_mins=r_item.get("estimated_time_mins", r_item.get("estimated_duration_mins", 30)),
                            completed_at=None
                        )
                        db.add(resource)
                else:
                    review_variations = [
                        {"title": f"Practical Drill: {step_info['step_title']}", "category": "Exercise", "notes": f"Implement a hands-on project or code example applying the concepts of {step_info['step_title']}."},
                        {"title": f"Deep-Dive Study: {step_info['step_title']}", "category": "Theory", "notes": f"Read reference material, articles, or documentation regarding {step_info['step_title']}."},
                        {"title": f"Active Recall Quiz: {step_info['step_title']}", "category": "Exercise", "notes": f"Create 3 flashcards or quiz questions covering key terminology of {step_info['step_title']}."},
                        {"title": f"Study Notes Consolidation: {step_info['step_title']}", "category": "Theory", "notes": f"Summarize today's core takeaways and organize your notes for {step_info['step_title']}."},
                        {"title": f"Review & Refine: {step_info['step_title']}", "category": "Projects", "notes": f"Re-read your notes, correct earlier mistakes, and cement your understanding of {step_info['step_title']}."}
                    ]
                    var = review_variations[(day_idx - 1) % len(review_variations)]
                    resource = Resource(
                        day_id=db_day.id,
                        title=var["title"],
                        category=var["category"],
                        platform="Course Material",
                        difficulty="Medium",
                        is_completed=False,
                        notes=var["notes"],
                        revision_count=0,
                        estimated_duration_mins=30,
                        completed_at=None
                    )
                    db.add(resource)

        db.commit()
        logger.info(f"PDF Roadmap successfully generated and saved for Goal ID: {goal.id}")
        return True
