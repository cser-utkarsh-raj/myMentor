import os
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import Goal, Track, Module, Day, Resource
from app.core.logger import logger

class RoadmapService:
    """Build one meaningful learning unit per calendar day instead of stretching a few topics across a timeline."""

    @staticmethod
    def _flatten(template: Dict[str, Any]) -> List[Dict[str, Any]]:
        flat = []
        for ti, track in enumerate(template.get("tracks", [])):
            for mi, module in enumerate(track.get("modules", track.get("milestones", []))):
                for si, step in enumerate(module.get("steps", [])):
                    flat.append({
                        "track_title": track.get("title") or "Core Curriculum",
                        "track_desc": track.get("description") or "Progressive learning track",
                        "track_order": track.get("order", ti + 1),
                        "module_title": module.get("title") or "Learning Module",
                        "module_desc": module.get("description") or "",
                        "module_order": module.get("order", mi + 1),
                        "step_title": step.get("title") or f"Learning Step {si + 1}",
                        "day_number": step.get("day_number"),
                        "phase": step.get("phase", "Learn"),
                        "resources": step.get("resources", step.get("tasks", [])) or []
                    })
        return flat

    @staticmethod
    def _resource_from_item(item: Dict[str, Any], default_platform: str, phase: str = "Learn") -> Dict[str, Any]:
        return {
            "title": item.get("title") or "Learning Resource",
            "category": item.get("category") or ("Practice" if phase in {"Practice", "Assessment"} else "Theory"),
            "platform": item.get("platform") or default_platform,
            "difficulty": item.get("difficulty") or "Medium",
            "estimated_time_mins": max(10, int(item.get("estimated_time_mins", item.get("estimated_duration_mins", 30)) or 30)),
            "external_url": item.get("external_url") or item.get("url") or item.get("link") or "",
            "notes": item.get("notes") or ""
        }

    @staticmethod
    def _static_template(goal_title: str) -> Dict[str, Any]:
        title_lower = (goal_title or "").lower()
        filename = "custom_goal.json"
        mapping = [
            (("full-stack", "fullstack", "full stack"), "fullstack_developer.json"),
            (("backend", "api design"), "backend_developer.json"),
            (("machine learning", "artificial intelligence", "ai"), "ai_machine_learning.json"),
            (("python",), "learn_python.json"),
            (("data science", "data analytics"), "data_science.json"),
            (("devops", "cloud"), "devops_cloud.json"),
            (("cybersecurity", "ethical hacking", "security"), "cybersecurity.json"),
            (("ui/ux", "ui", "ux", "creative design"), "ui_ux_design.json"),
            (("product management", "product manager"), "product_management.json"),
            (("finance", "investing", "financial"), "finance_investing.json"),
            (("digital marketing", "marketing"), "digital_marketing.json"),
            (("spanish", "language"), "learn_spanish.json")
        ]
        for keywords, candidate in mapping:
            if any(k in title_lower for k in keywords):
                filename = candidate
                break
        path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources", "roadmaps", filename)
        try:
            with open(path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except Exception as exc:
            logger.warning(f"Static roadmap template unavailable: {path}: {exc}")
            return {"title": goal_title, "tracks": [{"title": "Core Curriculum", "description": "Foundations to practical mastery", "order": 1, "modules": [{"title": "Foundations", "description": "Start with the fundamentals", "order": 1, "steps": [{"title": f"Foundations of {goal_title}", "resources": [{"title": f"Study the foundations of {goal_title}", "category": "Theory", "platform": "Internal", "difficulty": "Easy", "estimated_time_mins": 45, "notes": "Learn the core vocabulary, mental models and first principles."}]}]}]}]}

    @staticmethod
    def _expand_static_template(template: Dict[str, Any], timeline_days: int) -> Dict[str, Any]:
        source = RoadmapService._flatten(template)
        if not source: return {}
        phases = ["Learn", "Practice", "Build", "Review", "Assessment"]
        daily = []
        for day in range(1, timeline_days + 1):
            cycle_index = day - 1
            source_item = source[cycle_index % len(source)]
            phase = phases[(cycle_index // len(source)) % len(phases)]
            original = source_item["resources"]
            base = original[cycle_index % len(original)] if original else {}
            resource = RoadmapService._resource_from_item(base, base.get("platform", "Internal"), phase)
            topic = source_item["step_title"]
            phase_title = {"Learn": f"Learn: {topic}", "Practice": f"Practice: {topic}", "Build": f"Build: {topic}", "Review": f"Retrieval Review: {topic}", "Assessment": f"Assess & Repair: {topic}"}[phase]
            resource["title"] = f"{phase}: {resource['title']}"
            resource["notes"] = (resource.get("notes") or "") + f" Phase: {phase}. Produce evidence of understanding instead of passive reading."
            if phase == "Practice": resource["category"] = "Practice"
            elif phase == "Build": resource["category"] = "Project"
            elif phase == "Assessment": resource["category"] = "Assessment"
            daily.append({**source_item, "day_number": day, "phase": phase, "step_title": phase_title, "resources": [resource]})

        tracks = {}
        for item in daily:
            tracks.setdefault(item["track_title"], {"title": item["track_title"], "description": item["track_desc"], "order": item["track_order"], "modules": {}})
            track = tracks[item["track_title"]]
            track["modules"].setdefault(item["module_title"], {"title": item["module_title"], "description": item["module_desc"], "order": item["module_order"], "steps": []})
            track["modules"][item["module_title"]]["steps"].append(item)
        return {"title": template.get("title", "Personalized Roadmap"), "tracks": [{**t, "modules": list(t["modules"].values())} for t in sorted(tracks.values(), key=lambda x: x["order"])]}

    @staticmethod
    def _ai_template_is_valid(template: Dict[str, Any], timeline_days: int) -> bool:
        if not isinstance(template, dict) or not template.get("tracks"): return False
        steps = RoadmapService._flatten(template)
        numbers = {int(s["day_number"]) for s in steps if str(s.get("day_number", "")).isdigit()}
        if len(steps) < max(7, int(timeline_days * 0.85)): return False
        if not set(range(1, timeline_days + 1)).issubset(numbers): return False
        return True

    @staticmethod
    def generate_roadmap(db: Session, goal: Goal) -> bool:
        from app.services.ai_service import AIService
        template = None
        try:
            if AIService.is_available():
                candidate = AIService.generate_smart_roadmap(goal.title, goal.target or "None", goal.daily_hours, goal.timeline_days)
                if RoadmapService._ai_template_is_valid(candidate, goal.timeline_days):
                    template = candidate
                    logger.info("Accepted grounded day-by-day AI roadmap.")
                else:
                    logger.warning("AI roadmap failed curriculum quality checks; using curated fallback.")
        except Exception as exc:
            logger.error(f"AI roadmap generation failed; using curated fallback: {exc}")
        if template is None:
            template = RoadmapService._expand_static_template(RoadmapService._static_template(goal.title), goal.timeline_days)
        return RoadmapService._save_template_to_db(db, goal, template, default_platform="Internal")

    @staticmethod
    def get_roadmap_details(db: Session, goal_id: int) -> List[Track]:
        return db.query(Track).filter(Track.goal_id == goal_id).order_by(Track.order.asc()).all()

    @staticmethod
    def generate_roadmap_from_pdf_content(db: Session, goal: Goal, pdf_text: str) -> bool:
        from app.services.ai_service import AIService
        template = {}
        try:
            template = AIService.generate_roadmap_from_pdf(goal.title, goal.target or "None", goal.daily_hours, goal.timeline_days, pdf_text)
        except Exception as exc:
            logger.error(f"PDF roadmap AI generation failed: {exc}")
        if not RoadmapService._ai_template_is_valid(template, goal.timeline_days):
            clean = [line.strip() for line in (pdf_text or "").splitlines() if len(line.strip()) > 5][:20] or [f"Core Foundations of {goal.title}"]
            steps = [{"day_number": i + 1, "title": f"Study: {line[:70]}", "phase": "Learn", "resources": [{"title": f"Read & annotate: {line[:60]}", "category": "Theory", "platform": "Course Material", "difficulty": "Medium", "estimated_time_mins": 45, "external_url": "/app/pdfs", "notes": "Use the uploaded PDF as the primary source."}]} for i, line in enumerate((clean * ((goal.timeline_days // len(clean)) + 1))[:goal.timeline_days])]
            template = {"title": f"PDF Roadmap: {goal.title}", "tracks": [{"title": "PDF Curriculum", "description": "Topics derived from your uploaded material", "order": 1, "modules": [{"title": "Study & Practice", "description": "Active learning from the document", "order": 1, "steps": steps}]}]}
        try:
            for track in db.query(Track).filter(Track.goal_id == goal.id).all(): db.delete(track)
            db.flush()
            return RoadmapService._save_template_to_db(db, goal, template, default_platform="Course Material")
        except Exception as exc:
            logger.error(f"Failed rebuilding PDF roadmap: {exc}")
            db.rollback()
            return False

    @staticmethod
    def _save_template_to_db(db: Session, goal: Goal, template: Dict[str, Any], default_platform: str = "Internal") -> bool:
        flat_steps = RoadmapService._flatten(template)
        if not flat_steps: return False
        explicit_days = {int(s["day_number"]) for s in flat_steps if str(s.get("day_number", "")).isdigit()}
        if explicit_days != set(range(1, goal.timeline_days + 1)):
            template = RoadmapService._expand_static_template(template, goal.timeline_days)
            flat_steps = RoadmapService._flatten(template)
        tracks, modules, used_days = {}, {}, set()
        try:
            for idx, item in enumerate(sorted(flat_steps, key=lambda x: int(x.get("day_number") or 999999))):
                day_number = int(item.get("day_number") or idx + 1)
                if day_number in used_days or day_number < 1 or day_number > goal.timeline_days: continue
                used_days.add(day_number)
                track_key = item["track_title"]
                if track_key not in tracks:
                    tracks[track_key] = Track(goal_id=goal.id, title=track_key, description=item["track_desc"], order=item["track_order"])
                    db.add(tracks[track_key]); db.flush()
                module_key = f"{track_key}::{item['module_title']}"
                if module_key not in modules:
                    modules[module_key] = Module(track_id=tracks[track_key].id, title=item["module_title"], description=item["module_desc"], order=item["module_order"])
                    db.add(modules[module_key]); db.flush()
                day = Day(module_id=modules[module_key].id, day_number=day_number, title=item["step_title"], unlocked=(day_number == 1), is_completed=False, xp_rewarded=False)
                db.add(day); db.flush()
                resources = item["resources"] or [{"title": item["step_title"], "category": "Practice", "platform": default_platform, "difficulty": "Medium", "estimated_time_mins": min(60, max(30, int(goal.daily_hours * 30))), "external_url": "", "notes": "Complete an active-learning session and record what you learned."}]
                for raw in resources[:4]:
                    r = RoadmapService._resource_from_item(raw, default_platform, item.get("phase", "Learn"))
                    db.add(Resource(day_id=day.id, title=r["title"], category=r["category"], platform=r["platform"], difficulty=r["difficulty"], is_completed=False, notes=r["notes"], revision_count=0, estimated_duration_mins=r["estimated_time_mins"], external_url=r["external_url"] or None, completed_at=None, xp_reward=10))
            if used_days != set(range(1, goal.timeline_days + 1)):
                raise ValueError(f"Roadmap contains {len(used_days)} of {goal.timeline_days} required days")
            db.commit()
            return True
        except Exception as exc:
            logger.error(f"Failed saving roadmap: {exc}")
            db.rollback()
            return False
