import json
from google import genai
from google.genai import types
from app.core.config import settings
from app.core.logger import logger
from typing import Optional, List, Dict, Any


class AIService:
    """Core AI service using Google Gemini for all intelligent features."""

    _client = None

    @classmethod
    def _get_client(cls):
        if cls._client is None:
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is not configured. Set it in your .env file.")
            cls._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return cls._client

    @classmethod
    def is_available(cls) -> bool:
        return bool(settings.GEMINI_API_KEY)

    @classmethod
    def chat(cls, messages: List[Dict[str, str]], system_instruction: str = "") -> str:
        """
        Send a multi-turn conversation to Gemini and get a response.
        messages: list of {"role": "user"|"model", "text": "..."}
        """
        client = cls._get_client()
        
        contents = []
        for msg in messages:
            contents.append(
                types.Content(
                    role=msg["role"],
                    parts=[types.Part.from_text(text=msg["text"])]
                )
            )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction if system_instruction else None,
            temperature=0.7,
            max_output_tokens=4096,
        )

        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=contents,
                config=config,
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise

    @classmethod
    def generate_smart_roadmap(cls, goal_title: str, target: str, daily_hours: float, timeline_days: int) -> Dict[str, Any]:
        """
        Generate a complete learning roadmap using AI.
        Returns a structured JSON roadmap.
        """
        prompt = f"""You are an expert learning architect. Create a detailed, structured learning roadmap.

Goal: {goal_title}
Target Outcome: {target}
Daily Study Hours: {daily_hours}
Total Timeline: {timeline_days} days

Generate a JSON roadmap with this EXACT structure:
{{
  "title": "Roadmap Title",
  "target": "{target}",
  "tracks": [
    {{
      "title": "Track Name",
      "description": "Track description",
      "order": 1,
      "modules": [
        {{
          "title": "Module Name",
          "description": "Module description",  
          "order": 1,
          "steps": [
            {{
              "title": "Step/Day Title",
              "resources": [
                {{
                  "title": "Resource name",
                  "category": "Theory|Exercise|Video|Project",
                  "platform": "YouTube|LeetCode|GitHub|Documentation|Internal",
                  "difficulty": "Easy|Medium|Hard",
                  "estimated_time_mins": 30,
                  "notes": "Brief description"
                }}
              ]
            }}
          ]
        }}
      ]
    }}
  ]
}}

Rules:
- Create 3-5 tracks covering different aspects of the goal
- Each track should have 2-4 modules
- Each module should have 2-5 steps
- Steps should have 1-3 resources each
- Total steps should roughly match the timeline ({timeline_days} days)
- Resources should include real platforms (YouTube, documentation sites, practice platforms)
- Scale difficulty progressively from Easy to Hard
- Make it practical with projects and hands-on exercises
- Content should be specific and actionable, not generic

Return ONLY valid JSON, no markdown formatting, no code blocks."""

        try:
            client = cls._get_client()
            config = types.GenerateContentConfig(
                temperature=0.6,
                max_output_tokens=8192,
                response_mime_type="application/json",
            )
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=config,
            )
            result_text = response.text or "{}"
            return json.loads(result_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI roadmap JSON: {e}")
            return {}
        except Exception as e:
            logger.error(f"AI roadmap generation failed: {e}")
            return {}

    @classmethod
    def explain_topic(cls, topic: str, context: str = "", difficulty: str = "Medium") -> str:
        """Explain a learning topic in the context of the user's goal."""
        system = f"""You are Sensei, a friendly and knowledgeable learning mentor inside the myMentor app.
You explain concepts clearly with examples. Adjust your explanation depth based on difficulty level: {difficulty}.
If context about the user's learning goal is provided, relate explanations to their specific journey.
Keep responses concise but thorough. Use markdown formatting for readability."""
        
        user_msg = topic
        if context:
            user_msg = f"Context: I'm currently learning {context}.\n\nQuestion: {topic}"

        return cls.chat(
            messages=[{"role": "user", "text": user_msg}],
            system_instruction=system
        )

    @classmethod
    def summarize_pdf_text(cls, text_content: str, filename: str) -> Dict[str, Any]:
        """Summarize extracted PDF text into key points and flashcards."""
        prompt = f"""Analyze this learning material from \"{filename}\" and provide:
1. A concise summary (3-5 sentences)
2. Key concepts (5-10 bullet points)
3. 5 flashcard-style Q&A pairs for revision

Format your response as JSON:
{{
  "summary": "...",
  "key_concepts": ["concept1", "concept2", ...],
  "flashcards": [
    {{"question": "...", "answer": "..."}},
    ...
  ]
}}

Material content:
{text_content[:8000]}

Return ONLY valid JSON."""

        try:
            client = cls._get_client()
            config = types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=4096,
                response_mime_type="application/json",
            )
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=config,
            )
            return json.loads(response.text or "{}")
        except Exception as e:
            logger.error(f"PDF summarization failed: {e}")
            return {"summary": "Failed to generate summary.", "key_concepts": [], "flashcards": []}

    @classmethod
    def get_daily_tip(cls, goal_title: str, current_topic: str = "", streak: int = 0) -> str:
        """Generate a personalized daily learning tip."""
        prompt = f"""Generate a short, motivational daily learning tip (2-3 sentences max) for someone studying \"{goal_title}\".
Their current streak is {streak} days.
{f'They are currently working on: {current_topic}.' if current_topic else ''}
Make it specific, actionable, and encouraging. No generic platitudes."""

        return cls.chat(
            messages=[{"role": "user", "text": prompt}],
            system_instruction="You are Sensei, a concise learning mentor. Give short, punchy tips."
        )
