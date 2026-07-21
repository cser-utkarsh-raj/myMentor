import os
import json
from app.core.logger import logger
from typing import Dict, List, Any
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
    def get_resources_for_goal(cls, goal_title: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Returns built-in resources if it is a technology goal,
        otherwise uses Gemini AI to dynamically generate topic-specific resource suggestions.
        """
        logger.info(f"Loading resources specifically for goal: {goal_title}")
        title_lower = goal_title.lower()
        tech_keywords = [
            "developer", "programming", "software", "development", "react", 
            "python", "java", "sql", "dsa", "machine learning", "ai", 
            "coding", "data science", "angular", "node", "backend", "frontend"
        ]
        is_tech = any(kw in title_lower for kw in tech_keywords)
        
        if is_tech:
            return cls.get_all_resources()
            
        # Dynamically generate non-tech customized resources using Gemini AI
        from app.services.ai_service import AIService
        if AIService.is_available():
            try:
                prompt = f"""You are a curator of learning resources. Generate exactly 6 detailed, high-quality, real-world learning resources (books, video channels, documentation sites, online manuals, journals) specifically for this learning goal: "{goal_title}".
                
                Generate a JSON array of resources with this exact format:
                [
                  {{
                    "title": "Resource Title",
                    "category": "Theory|Video|Project|Manual",
                    "platform": "YouTube|Documentation|Journal|Official Site",
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
                    model="gemini-3.5-flash",
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
                    return {"custom_resources": resources}
            except Exception as e:
                logger.error(f"Failed to dynamically generate resources for {goal_title}: {e}")
                
        return {"custom_resources": []}
