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
        # Simple helper to skip boilerplate steps (like environment setup) for longer roadmaps 
        # because we want to focus on core concepts.
        combined = f"{step_title or ''} {module_title or ''}".lower()
        skip_markers = ["planning phase", "initial setup", "setup & research", "define core scope", "set up practice workspace"]
        if any(marker in combined for marker in skip_markers):
            return False
        return True

    @staticmethod
    def generate_roadmap(db: Session, goal: Goal) -> bool:
        logger.info(f"Generating dynamic roadmap for Goal: {goal.title}")
        template = None
        
        from app.services.ai_service import AIService
        if AIService.is_available():
            try:
                ai_roadmap = AIService.generate_smart_roadmap(
                    goal_title=goal.title,
                    target=goal.target or "None",
                    daily_hours=goal.daily_hours,
                    timeline_days=goal.timeline_days
                )
                if ai_roadmap and isinstance(ai_roadmap, dict) and ai_roadmap.get("tracks"):
                    test_steps = []
                    for t in ai_roadmap.get("tracks", []):
                        for m in t.get("modules", t.get("milestones", [])):
                            for s in m.get("steps", []):
                                test_steps.append(s)
                    if len(test_steps) > 0:
                        template = ai_roadmap
                        logger.info("Roadmap generated dynamically via Gemini AI.")
                    else:
                        logger.warning("AI roadmap returned tracks but zero steps. Falling back to static templates.")
            except Exception as e:
                logger.error(f"AI generation failed: {e}. Falling back to static templates.")

        def load_static_template(goal_title: str) -> Dict[str, Any]:
            title_lower = (goal_title or "").lower()
            filename = "custom_goal.json"
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
            
            resource_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources", "roadmaps", filename)
            if not os.path.exists(resource_path):
                resource_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources", "roadmaps", "custom_goal.json")
            try:
                with open(resource_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to read static template {resource_path}: {e}")
                return {
                    "tracks": [
                        {
                            "title": f"Mastery of {goal_title}",
                            "description": "Core curriculum milestones",
                            "order": 1,
                            "modules": [
                                {
                                    "title": "Foundational Principles",
                                    "description": "Essential topics and practice drills",
                                    "order": 1,
                                    "steps": [
                                        {
                                            "title": f"Core Foundations of {goal_title}",
                                            "resources": [
                                                {"title": f"Study Guide: {goal_title}", "category": "Theory", "platform": "Internal", "difficulty": "Easy", "estimated_time_mins": 30, "notes": f"Start with foundational concepts of {goal_title}."}
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }

        if template:
            try:
                success = RoadmapService._save_template_to_db(db, goal, template, default_platform="Internal")
                if success:
                    return True
            except Exception as se:
                logger.error(f"Failed saving AI template to DB: {se}")
                db.rollback()

        # Guaranteed fallback path
        static_tmpl = load_static_template(goal.title)
        return RoadmapService._save_template_to_db(db, goal, static_tmpl, default_platform="Internal")

    @staticmethod
    def get_roadmap_details(db: Session, goal_id: int) -> List[Track]:
        # Returns the full roadmap structures (tracks -> modules -> days -> resources) ordered chronologically.
        return db.query(Track).filter(Track.goal_id == goal_id).order_by(Track.order.asc()).all()

    @staticmethod
    def generate_roadmap_from_pdf_content(db: Session, goal: Goal, pdf_text: str) -> bool:
        # Step 1: Ask Gemini to analyze the parsed PDF text and build a matching curriculum template.
        logger.info(f"Generating dynamically customized PDF roadmap for Goal ID: {goal.id}")
        from app.services.ai_service import AIService
        
        try:
            template = AIService.generate_roadmap_from_pdf(
                goal_title=goal.title,
                target=goal.target or "None",
                daily_hours=goal.daily_hours,
                timeline_days=goal.timeline_days,
                pdf_extracted_text=pdf_text
            )
        except Exception as e:
            logger.error(f"Gemini PDF analysis failed: {e}")

        if not template or not template.get("tracks"):
            logger.warning("AI PDF roadmap generation failed or offline. Generating structured offline PDF roadmap from extracted text.")
            clean_lines = [line.strip() for line in pdf_text.splitlines() if len(line.strip()) > 5]
            title = goal.title or "PDF Study Guide"
            
            track1_steps = clean_lines[:min(5, len(clean_lines))] or [f"Core Foundations of {title}"]
            track2_steps = clean_lines[min(5, len(clean_lines)):min(10, len(clean_lines))] or [f"Practical Applications & Problem Solving"]
            track3_steps = clean_lines[min(10, len(clean_lines)):min(15, len(clean_lines))] or [f"Advanced Review & Master Quiz"]

            template = {
                "tracks": [
                    {
                        "title": f"📄 Core Syllabus: {title}",
                        "description": "Essential topics extracted from uploaded PDF document",
                        "order": 1,
                        "modules": [
                            {
                                "title": "Foundational Reading & Key Terms",
                                "description": "Primary concepts and definitions from study guide",
                                "order": 1,
                                "steps": [
                                    {
                                        "title": f"Study Section: {step_line[:60]}",
                                        "resources": [
                                            {
                                                "title": f"Read & Annotate: {step_line[:40]}",
                                                "category": "Theory",
                                                "platform": "Course Material",
                                                "difficulty": "Easy",
                                                "estimated_time_mins": 30,
                                                "notes": f"Focus on understanding the core principles outlined in this section of your uploaded PDF: '{step_line[:120]}'"
                                            }
                                        ]
                                    }
                                    for step_line in track1_steps
                                ]
                            }
                        ]
                    },
                    {
                        "title": "⚡ Deep Dive & Practice Drills",
                        "description": "Hands-on exercises and problem-solving based on PDF materials",
                        "order": 2,
                        "modules": [
                            {
                                "title": "Practical Exercises & Implementation",
                                "description": "Applying key formulas, algorithms, or theories",
                                "order": 1,
                                "steps": [
                                    {
                                        "title": f"Practice Drill: {step_line[:60]}",
                                        "resources": [
                                            {
                                                "title": f"Implement/Solve: {step_line[:40]}",
                                                "category": "Exercise",
                                                "platform": "Course Material",
                                                "difficulty": "Medium",
                                                "estimated_time_mins": 45,
                                                "notes": f"Create active recall flashcards or implement code examples covering: '{step_line[:120]}'"
                                            }
                                        ]
                                    }
                                    for step_line in track2_steps
                                ]
                            }
                        ]
                    },
                    {
                        "title": "🏆 Master Review & Self-Assessment",
                        "description": "Comprehensive summary, active recall, and exam prep",
                        "order": 3,
                        "modules": [
                            {
                                "title": "Exam Readiness & Revision",
                                "description": "Final consolidation of all PDF learning objectives",
                                "order": 1,
                                "steps": [
                                    {
                                        "title": f"Master Review: {step_line[:60]}",
                                        "resources": [
                                            {
                                                "title": f"Quiz & Consolidate: {step_line[:40]}",
                                                "category": "Project",
                                                "platform": "Course Material",
                                                "difficulty": "Hard",
                                                "estimated_time_mins": 60,
                                                "notes": f"Synthesize your notes and test yourself on: '{step_line[:120]}'"
                                            }
                                        ]
                                    }
                                    for step_line in track3_steps
                                ]
                            }
                        ]
                    }
                ]
            }

        # Step 2: Delete any previous roadmap details for this goal before building the new one.
        # This keeps the database clean and avoids conflicts.
        try:
            existing_tracks = db.query(Track).filter(Track.goal_id == goal.id).all()
            for t in existing_tracks:
                db.delete(t)
            db.flush()
        except Exception as de:
            logger.error(f"Error clearing old roadmap details: {de}")
            db.rollback()

        # Step 3: Save to the database using the same core distribution engine.
        return RoadmapService._save_template_to_db(db, goal, template, default_platform="Course Material")

    @staticmethod
    def _save_template_to_db(db: Session, goal: Goal, template: Dict[str, Any], default_platform: str = "Internal") -> bool:
        # 1. Flatten all nested structures in the JSON template (tracks -> modules -> steps)
        # into a flat list of study steps we need to schedule.
        flat_steps = []
        for track_idx, track_temp in enumerate(template.get("tracks", [])):
            for module_idx, module_temp in enumerate(track_temp.get("modules", track_temp.get("milestones", []))):
                for step_idx, step_temp in enumerate(module_temp.get("steps", [])):
                    if default_platform == "Internal" and not RoadmapService._should_include_step(
                        step_title=step_temp.get("title"),
                        module_title=module_temp.get("title"),
                        timeline_days=goal.timeline_days,
                    ):
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
            logger.error("No steps found to save. Generation canceled.")
            return False

        # 2. Scaling Engine: Distributes the flat steps proportionally across the target timeline days.
        # This maps any template size to fit the user's specific timeframe (e.g. 10 days, 45 days).
        db_tracks: Dict[str, Track] = {}
        db_modules: Dict[str, Module] = {}
        N = goal.timeline_days

        for i, step_info in enumerate(flat_steps):
            # Proportional distribution math: finds start and end days for this step in the timeline
            day_start = int(round(i * N / total_steps)) + 1
            day_end = int(round((i + 1) * N / total_steps))
            if day_end < day_start:
                day_end = day_start
            allocated_days_count = day_end - day_start + 1

            # Insert Track if it hasn't been created yet for this goal
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

            # Insert Module if it hasn't been created yet for this track
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

            # Insert days and allocate study resources to them
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

                # Slice resource list dynamically to distribute items evenly over multiple days
                if res_count > 0:
                    t_start = int(round(day_idx * res_count / allocated_days_count))
                    t_end = int(round((day_idx + 1) * res_count / allocated_days_count))
                    day_res = res_list[t_start:t_end]
                else:
                    day_res = []

                # If the template specified reference materials, save them as study tasks.
                if len(day_res) > 0:
                    for r_item in day_res:
                        resource = Resource(
                            day_id=db_day.id,
                            title=r_item.get("title", "Resource"),
                            category=r_item.get("category", "General"),
                            platform=r_item.get("platform", default_platform),
                            difficulty=r_item.get("difficulty", "Medium"),
                            is_completed=False,
                            notes=r_item.get("notes", ""),
                            revision_count=0,
                            estimated_duration_mins=r_item.get("estimated_time_mins", r_item.get("estimated_duration_mins", 30)),
                            completed_at=None
                        )
                        db.add(resource)
                # If no resources are listed in the template, auto-generate standard active learning drills
                # (practical coding exercises, recall quizzes, summaries) so the user always has actions to take!
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
                        platform=default_platform,
                        difficulty="Medium",
                        is_completed=False,
                        notes=var["notes"],
                        revision_count=0,
                        estimated_duration_mins=30,
                        completed_at=None
                    )
                    db.add(resource)
        db.commit()
        return True
