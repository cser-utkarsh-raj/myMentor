import os
import json
import urllib.parse
import re
from app.core.logger import logger
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

class ResourceService:
    @staticmethod
    def get_all_resources() -> Dict[str, List[Dict[str, Any]]]:
        resource_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources")
        resource_files = {
            "dsa_must_75": "must75.json", "dsa_blind_75": "blind75.json",
            "python_interview_40": "python40.json", "sql_25": "sql25.json", "java_core": "java.json"
        }
        library = {}
        for key, filename in resource_files.items():
            file_path = os.path.join(resource_dir, filename)
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r", encoding="utf-8") as f: library[key] = json.load(f)
                except Exception as e:
                    logger.error(f"Resource error {file_path}: {e}")
                    library[key] = []
            else: library[key] = []
        return library

    @classmethod
    def build_external_url(cls, title: str, category: str = "", platform: str = "", goal_title: str = "") -> str:
        clean = (title or "").strip()
        if not clean: return "https://www.google.com"
        q = urllib.parse.quote(clean)
        plat, cat, t_low = (platform or "").lower(), (category or "").lower(), clean.lower()

        if any(k in plat or k in cat or k in t_low for k in ["leetcode", "dsa", "coding", "algorithm", "two sum"]):
            slug = re.sub(r'\s+', '-', re.sub(r'[^a-z0-9\s-]', '', re.sub(r'^(leetcode\s*\d*[:\-]?\s*)', '', t_low, flags=re.IGNORECASE)).strip())
            return f"https://leetcode.com/problems/{slug}/" if len(slug) > 2 else f"https://leetcode.com/problemset/all/?search={q}"
        if any(k in plat or k in cat or k in t_low for k in ["youtube", "video", "one-shot"]):
            return f"https://www.youtube.com/results?search_query={urllib.parse.quote(clean + ' tutorial')}"
        if "book" in plat or "book" in cat or "book" in t_low: return f"https://books.google.com/books?q={q}"
        if "github" in plat or "project" in cat: return f"https://github.com/search?q={q}"
        if "pdf" in plat: return "/app/pdfs"
        return f"https://www.google.com/search?q={q}"

    @classmethod
    def _get_pdf_resources(cls, db: Optional[Session], user_id: Optional[str]) -> List[Dict[str, Any]]:
        if not db or not user_id: return []
        try:
            from app.models.models import PDF
            pdfs = db.query(PDF).filter(PDF.user_id == user_id, PDF.is_archived == False).order_by(PDF.upload_date.desc()).all()
            return [{
                "title": f"📄 {p.filename}", "category": p.category, "platform": "Local PDF", "difficulty": "Medium",
                "estimated_time_mins": max(15, p.size_bytes // 50000 * 10), "external_url": "/app/pdfs",
                "notes": "Uploaded study document. Ask Sensei to summarize or quiz you on this PDF."
            } for p in pdfs]
        except Exception as e:
            logger.error(f"Error loading PDF resources: {e}")
            return []

    @classmethod
    def _generate_offline_fallback(cls, goal_title: str) -> List[Dict[str, Any]]:
        items = [
            {"title": f"Intro to {goal_title}", "category": "Theory", "platform": "Documentation", "difficulty": "Easy", "estimated_time_mins": 30, "notes": f"Foundational concepts of {goal_title}."},
            {"title": f"{goal_title} — Video Tutorial", "category": "Video", "platform": "YouTube", "difficulty": "Easy", "estimated_time_mins": 45, "notes": f"Beginner-friendly {goal_title} tutorial."},
            {"title": f"{goal_title} — Reference Guide", "category": "Book", "platform": "Google Books", "difficulty": "Medium", "estimated_time_mins": 60, "notes": f"Core principles of {goal_title}."},
            {"title": f"{goal_title} Code Projects", "category": "Project", "platform": "GitHub", "difficulty": "Medium", "estimated_time_mins": 90, "notes": f"Practical projects for {goal_title}."}
        ]
        for item in items: item["external_url"] = cls.build_external_url(item["title"], item["category"], item["platform"], goal_title)
        return items

    @classmethod
    def get_resources_for_goal(cls, goal_title: str, db: Session = None, user_id: str = None) -> Dict[str, List[Dict[str, Any]]]:
        t_low = goal_title.lower()
        is_tech = any(kw in t_low for kw in ["developer", "programming", "software", "react", "python", "java", "sql", "dsa", "ai", "coding", "data science"])
        pdf_res = cls._get_pdf_resources(db, user_id)
        db_res = []

        if db and user_id:
            try:
                from app.models.models import Resource as DBRes, Goal as DBGoal, Track, Module, Day
                g = db.query(DBGoal).filter(DBGoal.user_id == user_id, DBGoal.title == goal_title).first()
                if g:
                    query = db.query(DBRes).join(Day, DBRes.day_id == Day.id).join(Module, Day.module_id == Module.id).join(Track, Module.track_id == Track.id).filter(Track.goal_id == g.id).all()
                    db_res = [{
                        "id": r.id, "title": r.title, "category": r.category, "platform": r.platform, "difficulty": r.difficulty,
                        "estimated_time_mins": r.estimated_duration_mins, "external_url": r.external_url or cls.build_external_url(r.title, r.category, r.platform, goal_title),
                        "is_completed": r.is_completed, "notes": r.notes or "", "xp_reward": r.xp_reward or 10
                    } for r in query]
            except Exception as e: logger.error(f"Error DB resources: {e}")

        if is_tech:
            library = cls.get_all_resources()
            for group, item_list in library.items():
                for item in item_list:
                    if not item.get("external_url"): item["external_url"] = cls.build_external_url(item.get("title", ""), item.get("category", ""), item.get("platform", ""), goal_title)
            if pdf_res: library["uploaded_pdfs"] = pdf_res
            if db_res: library["my_custom_resources"] = db_res
            return library

        from app.services.ai_service import AIService
        if AIService.is_available():
            try:
                prompt = f"""Curate 6 resources JSON array for goal "{goal_title}":
[{{"title": "...", "category": "Theory|Video|Project", "platform": "YouTube|Google Books|Documentation", "difficulty": "Easy|Medium|Hard", "estimated_time_mins": 60, "notes": "..."}}]
Return ONLY valid JSON."""
                res = AIService._generate_json(prompt, max_tokens=2048, temp=0.7)
                if isinstance(res, list):
                    for r in res:
                        if not r.get("external_url"): r["external_url"] = cls.build_external_url(r.get("title", ""), r.get("category", ""), r.get("platform", ""), goal_title)
                    return {"custom_resources": db_res + pdf_res + res}
            except Exception as e: logger.error(f"Failed AI resources for {goal_title}: {e}")

        fallback = cls._generate_offline_fallback(goal_title)
        return {"custom_resources": db_res + pdf_res + fallback}
