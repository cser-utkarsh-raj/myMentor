import os
import json
from app.core.logger import logger
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

class ResourceService:
    @staticmethod
    def get_all_resources() -> Dict[str, List[Dict[str, Any]]]:
        """
        Loads and returns all built-in question resource libraries from JSON files.
        """
        logger.info("Loading built-in resource library items.")
        resource_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources")
        
        resource_files = {
            "dsa_must_75": "must75.json",
            "dsa_blind_75": "blind75.json",
            "python_interview_40": "python40.json",
            "sql_25": "sql25.json",
            "java_core": "java.json"
        }
        
        library = {}
        
        for key, filename in resource_files.items():
            file_path = os.path.join(resource_dir, filename)
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        library[key] = json.load(f)
                except Exception as e:
                    logger.error(f"Error reading resource file {file_path}: {e}")
                    library[key] = []
            else:
                logger.warning(f"Resource library file not found: {file_path}")
                library[key] = []
                
        return library

    @classmethod
    def build_external_url(cls, title: str, category: str = "", platform: str = "", goal_title: str = "") -> str:
        import urllib.parse
        import re
        clean_title = (title or "").strip()
        if not clean_title:
            return "https://www.google.com"

        q = urllib.parse.quote(clean_title)
        platform_lower = (platform or "").lower()
        cat_lower = (category or "").lower()
        title_lower = clean_title.lower()

        # LeetCode / Coding Problem detection
        is_coding = (
            "leetcode" in platform_lower or 
            cat_lower in ["dsa", "algorithm", "coding", "dsa_blind_75", "dsa_must_75"] or 
            "leetcode" in title_lower or 
            "two sum" in title_lower or 
            "valid parentheses" in title_lower or
            "binary tree" in title_lower or
            "linked list" in title_lower
        )
        if is_coding:
            slug = re.sub(r'^(leetcode\s*\d*[:\-]?\s*)', '', title_lower, flags=re.IGNORECASE)
            slug = re.sub(r'[^a-z0-9\s-]', '', slug).strip()
            slug = re.sub(r'\s+', '-', slug)
            if slug and len(slug) > 2:
                return f"https://leetcode.com/problems/{slug}/"
            return f"https://leetcode.com/problemset/all/?search={q}"

        if "youtube" in platform_lower or cat_lower in ["video", "one-shot", "oneshot"] or "video" in title_lower or "one-shot" in title_lower:
            return f"https://www.youtube.com/results?search_query={urllib.parse.quote(clean_title + ' tutorial')}"
        if "book" in platform_lower or "book" in cat_lower or "book" in title_lower:
            return f"https://www.google.com/search?tbm=bks&q={q}"
        if "github" in platform_lower or cat_lower in ["project", "code"]:
            return f"https://github.com/search?q={q}"
        if "pdf" in platform_lower:
            return "/app/pdfs"

        return f"https://www.google.com/search?q={q}"

    @classmethod
    def _get_pdf_resources(cls, db: Optional[Session], user_id: Optional[str]) -> List[Dict[str, Any]]:
        """Convert user's uploaded PDFs into resource cards."""
        if not db or not user_id:
            return []
        try:
            from app.models.models import PDF
            pdfs = db.query(PDF).filter(
                PDF.user_id == user_id,
                PDF.is_archived == False
            ).order_by(PDF.upload_date.desc()).all()

            pdf_resources = []
            for pdf in pdfs:
                reading_time = max(15, pdf.size_bytes // 50000 * 10)
                pdf_resources.append({
                    "title": f"📄 {pdf.filename}",
                    "category": pdf.category,
                    "platform": "Local PDF",
                    "difficulty": "Medium",
                    "estimated_time_mins": reading_time,
                    "external_url": "/app/pdfs",
                    "notes": f"Uploaded study document. Ask Sensei to summarize, explain, or quiz you on this PDF."
                })
            return pdf_resources
        except Exception as e:
            logger.error(f"Error loading PDF resources: {e}")
            return []

    @classmethod
    def _generate_offline_fallback(cls, goal_title: str) -> List[Dict[str, Any]]:
        """Generate high-quality offline fallback resources when AI is unavailable."""
        items = [
            {"title": f"Introduction to {goal_title}", "category": "Theory", "platform": "Documentation", "difficulty": "Easy", "estimated_time_mins": 30, "notes": f"Start with foundational concepts and terminology of {goal_title}."},
            {"title": f"{goal_title} — Complete Video Tutorial & One-Shot", "category": "Video", "platform": "YouTube", "difficulty": "Easy", "estimated_time_mins": 45, "notes": f"Search YouTube for beginner-friendly {goal_title} tutorials and walkthroughs."},
            {"title": f"{goal_title} — Comprehensive Guide & Reference Book", "category": "Book", "platform": "Google Books", "difficulty": "Medium", "estimated_time_mins": 60, "notes": f"Deep dive into core principles and methodology of {goal_title}."},
            {"title": f"Practical {goal_title} Projects & Code Repo", "category": "Project", "platform": "GitHub", "difficulty": "Medium", "estimated_time_mins": 90, "notes": f"Hands-on practice projects to apply {goal_title} concepts in real scenarios."},
            {"title": f"{goal_title} — Community & Forum Discussions", "category": "Theory", "platform": "Documentation", "difficulty": "Easy", "estimated_time_mins": 20, "notes": f"Join communities, forums, and discussion groups dedicated to {goal_title}."},
            {"title": f"Advanced {goal_title} Masterclass", "category": "Video", "platform": "YouTube", "difficulty": "Hard", "estimated_time_mins": 60, "notes": f"Master advanced strategies and expert-level knowledge in {goal_title}."}
        ]
        for item in items:
            item["external_url"] = cls.build_external_url(item["title"], item["category"], item["platform"], goal_title)
        return items

    @classmethod
    def get_resources_for_goal(cls, goal_title: str, db: Session = None, user_id: str = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Returns built-in resources if it is a technology goal,
        otherwise uses Gemini AI to dynamically generate topic-specific resource suggestions.
        Always includes user's uploaded PDFs as resource cards.
        Never returns empty — falls back to offline resources if AI fails.
        """
        logger.info(f"Loading resources specifically for goal: {goal_title}")
        title_lower = goal_title.lower()
        tech_keywords = [
            "developer", "programming", "software", "development", "react", 
            "python", "java", "sql", "dsa", "machine learning", "ai", 
            "coding", "data science", "angular", "node", "backend", "frontend"
        ]
        is_tech = any(kw in title_lower for kw in tech_keywords)
        
        pdf_resources = cls._get_pdf_resources(db, user_id)

        # Include custom goal resources created in DB
        db_resources = []
        if db and user_id:
            try:
                from app.models.models import Resource as DBResource, Goal as DBGoal, Track, Module, Day
                goal_obj = db.query(DBGoal).filter(DBGoal.user_id == user_id, DBGoal.title == goal_title).first()
                if goal_obj:
                    res_query = (
                        db.query(DBResource)
                        .join(Day, DBResource.day_id == Day.id)
                        .join(Module, Day.module_id == Module.id)
                        .join(Track, Module.track_id == Track.id)
                        .filter(Track.goal_id == goal_obj.id)
                        .all()
                    )
                    for r in res_query:
                        url = r.external_url or cls.build_external_url(r.title, r.category, r.platform, goal_title)
                        db_resources.append({
                            "id": r.id,
                            "title": r.title,
                            "category": r.category,
                            "platform": r.platform,
                            "difficulty": r.difficulty,
                            "estimated_time_mins": r.estimated_duration_mins,
                            "external_url": url,
                            "is_completed": r.is_completed,
                            "notes": r.notes or "",
                            "xp_reward": r.xp_reward or 10
                        })
            except Exception as dbe:
                logger.error(f"Error fetching DB resources: {dbe}")

        if is_tech:
            library = cls.get_all_resources()
            # Auto-populate working external_urls for all tech library items
            for group, item_list in library.items():
                for item in item_list:
                    if not item.get("external_url"):
                        item["external_url"] = cls.build_external_url(item.get("title", ""), item.get("category", ""), item.get("platform", ""), goal_title)
            if pdf_resources:
                library["uploaded_pdfs"] = pdf_resources
            if db_resources:
                library["my_custom_resources"] = db_resources
            return library
            
        # Dynamically generate non-tech customized resources using Gemini AI
        from app.services.ai_service import AIService
        if AIService.is_available():
            try:
                prompt = f"""You are a curator of learning resources. Generate exactly 6 detailed, high-quality, real-world learning resources (books, YouTube one-shot tutorials, documentation sites, online manuals, journals) specifically for this learning goal: "{goal_title}".
                
                Generate a JSON array of resources with this exact format:
                [
                  {{
                    "title": "Resource Title (e.g. YouTube One-Shot / Reference Book)",
                    "category": "Theory|Video|Project|Manual|Book|One-Shot",
                    "platform": "YouTube|Google Books|Documentation|GitHub|Official Site",
                    "difficulty": "Easy|Medium|Hard",
                    "estimated_time_mins": 60,
                    "notes": "A brief 2-sentence description of what this resource is and how it helps the user."
                  }}
                ]
                
                Return ONLY valid JSON, no markdown formatting, no code blocks."""
                
                from google.genai import types
                client = AIService._get_client()
                config = types.GenerateContentConfig(
                    temperature=0.7,
                    response_mime_type="application/json",
                )
                response = client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=prompt,
                    config=config,
                )
                result_text = (response.text or "[]").strip()
                if result_text.startswith("```"):
                    first_newline = result_text.find("\n")
                    if first_newline != -1:
                        result_text = result_text[first_newline:].strip()
                    if result_text.endswith("```"):
                        result_text = result_text[:-3].strip()
                        
                resources = json.loads(result_text)
                if isinstance(resources, list):
                    for res in resources:
                        if not res.get("external_url"):
                            res["external_url"] = cls.build_external_url(res.get("title", ""), res.get("category", ""), res.get("platform", ""), goal_title)
                    return {"custom_resources": db_resources + pdf_resources + resources}
            except Exception as e:
                logger.error(f"Failed to dynamically generate resources for {goal_title}: {e}")
                
        # Offline fallback — never return empty
        fallback = cls._generate_offline_fallback(goal_title)
        return {"custom_resources": db_resources + pdf_resources + fallback}
