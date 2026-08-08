import json
import time
from google import genai
from google.genai import types
from app.core.config import settings
from app.core.logger import logger
from typing import Optional, List, Dict, Any


class AIService:
    """Core AI service using Google Gemini for all intelligent features."""

    _client = None
    _cache: Dict[str, Dict[str, Any]] = {}
    _cooldown_until = 0.0
    CACHE_TTL = 3600  # 1 hour
    PRIMARY_MODEL = "gemini-2.0-flash"
    FALLBACK_MODELS = [
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-pro"
    ]

    @classmethod
    def _get_api_keys(cls) -> List[str]:
        keys = []
        for k in [settings.GEMINI_API_KEY, settings.GEMINI_API_KEY_2, settings.GEMINI_API_KEY_3]:
            if k and k.strip():
                keys.append(k.strip())
        return keys

    @classmethod
    def _mark_unavailable(cls, duration_seconds: int = 15) -> None:
        cls._cooldown_until = time.time() + duration_seconds

    @classmethod
    def is_available(cls) -> bool:
        return len(cls._get_api_keys()) > 0 and time.time() >= cls._cooldown_until

    @classmethod
    def _get_cached(cls, key: str) -> Optional[str]:
        entry = cls._cache.get(key)
        if entry and (time.time() - entry["timestamp"]) < cls.CACHE_TTL:
            return entry["response"]
        return None

    @classmethod
    def _set_cache(cls, key: str, value: str):
        cls._cache[key] = {"response": value, "timestamp": time.time()}

    @classmethod
    def _fallback_response(cls) -> str:
        return (
            "Sensei's AI brain is temporarily on cooldown — the AI service hit a snag. "
            "This happens occasionally with API rate limits or network connectivity.\n\n"
            "Do not worry, I will be back shortly! In the meantime, check out your **Roadmap** "
            "for today's tasks, or browse the **Resources** page for study materials. Keep pushing forward!"
        )

    @classmethod
    def _generate(cls, contents: Any, config: Any) -> Any:
        keys = cls._get_api_keys()
        if not keys:
            raise RuntimeError("No GEMINI_API_KEY is configured")

        last_exception = None
        for key in keys:
            try:
                client = genai.Client(api_key=key)
                for model in [cls.PRIMARY_MODEL] + cls.FALLBACK_MODELS:
                    try:
                        return client.models.generate_content(model=model, contents=contents, config=config)
                    except Exception as me:
                        last_exception = me
                        logger.warning(f"Gemini model '{model}' failed on key: {me}. Trying next model...")
                        time.sleep(0.2)
            except Exception as ke:
                last_exception = ke
                logger.warning(f"Gemini API key failure: {ke}. Rotating to next API key...")
                time.sleep(0.3)
        if last_exception:
            raise last_exception
        raise RuntimeError("All Gemini API keys and models failed")

    @classmethod
    def _clean_json_text(cls, text: str) -> str:
        res = (text or "{}").strip()
        if res.startswith("```"):
            nl = res.find("\n")
            if nl != -1: res = res[nl:].strip()
            if res.endswith("```"): res = res[:-3].strip()
        
        # Robust slice from first '{' to last '}'
        start = res.find("{")
        end = res.rfind("}")
        if start != -1 and end != -1 and end > start:
            res = res[start:end+1]
        return res

    @classmethod
    def _generate_json(cls, prompt: str, max_tokens: int = 8192, temp: float = 0.5) -> Dict[str, Any]:
        config = types.GenerateContentConfig(temperature=temp, max_output_tokens=max_tokens, response_mime_type="application/json")
        response = cls._generate(contents=prompt, config=config)
        cleaned = cls._clean_json_text(response.text or "{}")
        try:
            return json.loads(cleaned)
        except Exception as pe:
            logger.error(f"JSON parse error on AI response: {pe}")
            raise pe

    @classmethod
    def chat(cls, messages: List[Dict[str, str]], system_instruction: str = "") -> str:
        contents = [types.Content(role=m["role"], parts=[types.Part.from_text(text=m["text"])]) for m in messages]
        config = types.GenerateContentConfig(system_instruction=system_instruction or None, temperature=0.7, max_output_tokens=4096)
        try:
            return cls._generate(contents=contents, config=config).text or ""
        except Exception as e:
            logger.error(f"Gemini API error in chat: {e}")
            return cls._fallback_response()

    @classmethod
    def generate_smart_roadmap(cls, goal_title: str, target: str, daily_hours: float, timeline_days: int) -> Dict[str, Any]:
        target_lower = target.lower()
        directive = "Structure roadmap around hands-on execution and practical deliverables."
        if "interview" in target_lower:
            directive = "Structure roadmap specifically for technical interview questions, coding speed drills, and LeetCode sets."
        elif "job" in target_lower or "career" in target_lower:
            directive = "Structure roadmap around production-ready capstone projects, portfolio building, and resume deliverables."

        prompt = f"""You are an expert learning architect. Create a progressive, day-by-day learning roadmap.
Goal: {goal_title} | Target: {target} | Daily Hours: {daily_hours} | Timeline: {timeline_days} days
Directive: {directive}

IMPORTANT PROGRESSION RULES:
1. ORDERING: The roadmap MUST strictly progress from Easy Basics & Foundations (Track 1) -> Intermediate Practice & Core Implementations (Track 2) -> Advanced Topics & Peak Mastery Capstone (Track 3).
2. TOPIC DIVERSITY: Each daily step must focus on a distinct, non-repeating concept moving sequentially forward.
3. DIFFICULTY ACCURACY: Resources for early steps must be marked "Easy", middle steps "Medium", and final capstone steps "Hard".

Generate JSON structure:
{{
  "title": "Roadmap Title", "target": "{target}",
  "tracks": [
    {{
      "title": "Track Name", "description": "Track desc", "order": 1,
      "modules": [
        {{
          "title": "Module Name", "description": "Module desc", "order": 1,
          "steps": [
            {{
              "title": "Step Title",
              "resources": [
                {{"title": "Res title", "category": "Theory|Video|Project", "platform": "YouTube|GitHub|Documentation", "difficulty": "Easy|Medium|Hard", "estimated_time_mins": 30, "notes": "Notes"}}
              ]
            }}
          ]
        }}
      ]
    }}
  ]
}}
Return ONLY valid JSON."""

        try:
            return cls._generate_json(prompt)
        except Exception as e:
            if any(k in str(e).lower() for k in ["429", "quota", "resource_exhausted"]):
                cls._mark_unavailable()
            logger.error(f"AI roadmap generation failed: {e}")
            return {}

    @classmethod
    def generate_roadmap_from_pdf(cls, goal_title: str, target: str, daily_hours: float, timeline_days: int, pdf_extracted_text: str) -> Dict[str, Any]:
        prompt = f"""You are an expert learning architect. Analyze the extracted PDF study material and create a structured learning roadmap.
Goal: {goal_title} | Target: {target} | Daily Hours: {daily_hours} | Timeline: {timeline_days} days
Extracted PDF Material:
{pdf_extracted_text[:6000]}

Generate JSON structure:
{{
  "title": "PDF Roadmap: {goal_title}",
  "tracks": [
    {{
      "title": "Core Syllabus", "description": "Key concepts from uploaded PDF", "order": 1,
      "modules": [
        {{
          "title": "Primary Concepts", "description": "Module overview", "order": 1,
          "steps": [
            {{
              "title": "Study Section",
              "resources": [
                {{"title": "Resource title", "category": "Theory", "platform": "Course Material", "difficulty": "Medium", "estimated_time_mins": 30, "notes": "Notes"}}
              ]
            }}
          ]
        }}
      ]
    }}
  ]
}}
Return ONLY valid JSON."""

        try:
            return cls._generate_json(prompt, max_tokens=4096)
        except Exception as e:
            logger.error(f"AI PDF roadmap generation failed: {e}")
            return {}

    @classmethod
    def explain_topic(cls, topic: str, context: str = "", difficulty: str = "Medium") -> str:
        cache_key = f"explain_{topic[:50]}_{difficulty}"
        cached = cls._get_cached(cache_key)
        if cached: return cached

        system = f"You are Sensei, a knowledgeable learning mentor. Explain clearly with examples for difficulty: {difficulty}."
        user_msg = f"Context: {context}\n\nQuestion: {topic}" if context else topic
        try:
            result = cls.chat(messages=[{"role": "user", "text": user_msg}], system_instruction=system)
            cls._set_cache(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Explain topic failed: {e}")
            return f"I couldn't generate an explanation right now. Search for **{topic}** on YouTube or docs!"

    @classmethod
    def summarize_pdf_text(cls, text_content: str, filename: str) -> Dict[str, Any]:
        cache_key = f"pdf_summary_{filename}"
        cached = cls._get_cached(cache_key)
        if cached:
            try: return json.loads(cached)
            except Exception: pass

        prompt = f"""Summarize material from \"{filename}\":
JSON format: {{"summary": "...", "key_concepts": ["..."], "flashcards": [{{"question": "...", "answer": "..."}}]}}
Content: {text_content[:8000]}
Return ONLY valid JSON."""
        try:
            res = cls._generate_json(prompt, max_tokens=4096)
            cls._set_cache(cache_key, json.dumps(res))
            return res
        except Exception as e:
            logger.error(f"PDF summarization failed: {e}")
            return {"summary": "AI service temporarily unavailable.", "key_concepts": [], "flashcards": []}

    @classmethod
    def get_daily_tip(cls, goal_title: str, current_topic: str = "", streak: int = 0) -> str:
        cache_key = f"daily_tip_{goal_title}_{streak}"
        cached = cls._get_cached(cache_key)
        if cached: return cached

        prompt = f"Short motivational tip (2 sentences max) for studying \"{goal_title}\". Streak: {streak}d. Topic: {current_topic}."
        try:
            res = cls.chat(messages=[{"role": "user", "text": prompt}], system_instruction="You are Sensei, a concise mentor.")
            cls._set_cache(cache_key, res)
            return res
        except Exception as e:
            logger.error(f"Daily tip failed: {e}")
            return "Keep pushing forward! Consistency is key. Every session compounds over time. 🔥"

    @classmethod
    def summarize_and_extract_memory(cls, messages: List[Any], goal_title: str) -> Dict[str, Any]:
        chat_transcript = "\n".join(f"{getattr(m, 'role', 'user')}: {getattr(m, 'text', '')}" for m in messages[-10:])
        prompt = f"""Extract memory profile JSON {{"strengths": "...", "weaknesses": "...", "preferences": "...", "progress_summary": "..."}} for goal "{goal_title}".
Transcript: {chat_transcript}
Return ONLY valid JSON."""
        try:
            return cls._generate_json(prompt, max_tokens=1024, temp=0.4)
        except Exception as e:
            logger.error(f"Memory extraction failed: {e}")
            return {}

    @classmethod
    def generate_roadmap_from_pdf(cls, goal_title: str, target: str, daily_hours: float, timeline_days: int, pdf_extracted_text: str) -> Dict[str, Any]:
        snippet = pdf_extracted_text[:12000] if pdf_extracted_text else ""
        prompt = f"""Create structured roadmap JSON from PDF snippet for Goal: {goal_title}, Target: {target}, Timeline: {timeline_days} days.
Snippet: {snippet}
Return ONLY valid JSON."""
        try:
            return cls._generate_json(prompt)
        except Exception as e:
            logger.error(f"Failed roadmap from PDF: {e}")
            return {}
