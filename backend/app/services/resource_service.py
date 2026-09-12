import os
import json
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.core.logger import logger

class ResourceService:
    CANONICAL = {
        "react": "https://react.dev/learn",
        "typescript": "https://www.typescriptlang.org/docs/",
        "tanstack query": "https://tanstack.com/query/latest/docs/framework/react/overview",
        "node.js": "https://nodejs.org/docs/latest/api/",
        "nodejs": "https://nodejs.org/docs/latest/api/",
        "fastapi": "https://fastapi.tiangolo.com/",
        "python": "https://docs.python.org/3/",
        "postgresql": "https://www.postgresql.org/docs/",
        "docker": "https://docs.docker.com/get-started/",
        "github actions": "https://docs.github.com/en/actions",
        "git": "https://git-scm.com/doc",
        "mdn": "https://developer.mozilla.org/",
        "sql": "https://www.postgresql.org/docs/current/tutorial.html",
        "leetcode": "https://leetcode.com/problemset/",
        "codeforces": "https://codeforces.com/problemset",
        "freecodecamp": "https://www.freecodecamp.org/learn/",
    }

    @classmethod
    def canonical_url(cls, title: str, platform: str = "", category: str = "") -> str:
        text = f"{title} {platform} {category}".lower()
        for key, url in cls.CANONICAL.items():
            if key in text: return url
        return ""

    @classmethod
    def build_external_url(cls, title: str, category: str = "", platform: str = "", goal_title: str = "") -> str:
        # Backward-compatible API used by custom-resource creation.
        return cls.canonical_url(title, platform, category)

    @classmethod
    def normalize_item(cls, item: Dict[str, Any], goal_title: str = "") -> Dict[str, Any]:
        item = dict(item or {})
        item["title"] = item.get("title") or "Untitled Resource"
        item["category"] = item.get("category") or "General"
        item["platform"] = item.get("platform") or "Documentation"
        item["difficulty"] = item.get("difficulty") or "Medium"
        item["estimated_time_mins"] = max(10, int(item.get("estimated_time_mins", item.get("estimated_duration_mins", 30)) or 30))
        item["external_url"] = item.get("external_url") or item.get("url") or item.get("link") or cls.canonical_url(item["title"], item["platform"], item["category"])
        item["notes"] = item.get("notes") or ""
        return item

    @classmethod
    def get_all_resources(cls) -> Dict[str, List[Dict[str, Any]]]:
        resource_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources")
        resource_files = {"dsa_must_75": "must75.json", "dsa_blind_75": "blind75.json", "python_interview_40": "python40.json", "sql_25": "sql25.json", "java_core": "java.json"}
        library = {}
        for key, filename in resource_files.items():
            path = os.path.join(resource_dir, filename)
            try:
                with open(path, "r", encoding="utf-8") as handle:
                    data = json.load(handle)
                    library[key] = [cls.normalize_item(x) for x in data] if isinstance(data, list) else []
            except Exception as exc:
                logger.warning(f"Resource library {filename} unavailable: {exc}")
                library[key] = []
        return library

    @classmethod
    def _get_pdf_resources(cls, db: Optional[Session], user_id: Optional[str]) -> List[Dict[str, Any]]:
        if not db or not user_id: return []
        try:
            from app.models.models import PDF
            pdfs = db.query(PDF).filter(PDF.user_id == user_id, PDF.is_archived == False).order_by(PDF.upload_date.desc()).all()
            return [cls.normalize_item({"id": p.id, "title": f"📄 {p.filename}", "category": p.category, "platform": "Local PDF", "difficulty": "Medium", "estimated_time_mins": max(15, p.size_bytes // 50000 * 10), "external_url": "/app/pdfs", "notes": "Uploaded study document. Ask Sensei to summarize or quiz you on this PDF."}) for p in pdfs]
        except Exception as exc:
            logger.warning(f"PDF resource lookup failed: {exc}")
            return []

    @classmethod
    def _get_goal_resources(cls, db: Optional[Session], user_id: Optional[str], goal_title: str) -> List[Dict[str, Any]]:
        if not db or not user_id: return []
        try:
            from app.models.models import Resource as DBRes, Goal as DBGoal, Track, Module, Day
            goal = db.query(DBGoal).filter(DBGoal.user_id == user_id, DBGoal.title == goal_title).order_by(DBGoal.created_at.desc()).first()
            if not goal: return []
            rows = db.query(DBRes).join(Day, DBRes.day_id == Day.id).join(Module, Day.module_id == Module.id).join(Track, Module.track_id == Track.id).filter(Track.goal_id == goal.id).order_by(Day.day_number.asc(), DBRes.id.asc()).all()
            return [cls.normalize_item({"id": r.id, "title": r.title, "category": r.category, "platform": r.platform, "difficulty": r.difficulty, "estimated_time_mins": r.estimated_duration_mins, "external_url": r.external_url, "is_completed": r.is_completed, "notes": r.notes or "", "xp_reward": r.xp_reward or 10}, goal_title) for r in rows]
        except Exception as exc:
            logger.warning(f"Goal resource lookup failed: {exc}")
            return []

    @classmethod
    def _relevant_library(cls, goal_title: str) -> Dict[str, List[Dict[str, Any]]]:
        t = goal_title.lower()
        library = cls.get_all_resources()
        if any(k in t for k in ["dsa", "algorithm", "interview", "software engineer"]): return {k: v for k, v in library.items() if k in {"dsa_must_75", "dsa_blind_75"}}
        if "python" in t: return {"python_interview_40": library["python_interview_40"]}
        if "sql" in t or "database" in t: return {"sql_25": library["sql_25"]}
        if "java" in t: return {"java_core": library["java_core"]}
        if any(k in t for k in ["full-stack", "full stack", "backend", "web", "developer"]): return {"dsa_must_75": library["dsa_must_75"], "sql_25": library["sql_25"]}
        return {}

    @classmethod
    def get_resources_for_goal(cls, goal_title: str, db: Session = None, user_id: str = None) -> Dict[str, List[Dict[str, Any]]]:
        goal_resources = cls._get_goal_resources(db, user_id, goal_title)
        pdf_resources = cls._get_pdf_resources(db, user_id)
        result: Dict[str, List[Dict[str, Any]]] = {}
        if goal_resources: result["roadmap_resources"] = goal_resources
        result.update(cls._relevant_library(goal_title))
        if pdf_resources: result["uploaded_pdfs"] = pdf_resources
        if not result:
            from app.services.ai_service import AIService
            if AIService.is_available():
                try:
                    prompt = f"Find 6 high-quality, directly usable learning resources for {goal_title}. Use Google Search grounding. Prefer official docs and reputable free resources. Return JSON object {{\"resources\":[{{\"title\":\"...\",\"category\":\"Theory|Practice|Project|Documentation\",\"platform\":\"...\",\"difficulty\":\"Easy|Medium|Hard\",\"estimated_time_mins\":60,\"external_url\":\"https://...\",\"notes\":\"...\"}}]}}. Never return Google search URLs."
                    generated = AIService._generate_json(prompt, max_tokens=5000, temp=0.25, grounded=True)
                    items = generated.get("resources", []) if isinstance(generated, dict) else []
                    result["recommended"] = [cls.normalize_item(x, goal_title) for x in items if isinstance(x, dict)]
                except Exception as exc: logger.warning(f"AI resource curation failed: {exc}")
        return result
