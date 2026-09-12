import json
import time
import urllib.request
from typing import List, Dict, Any
from google import genai
from google.genai import types
from app.core.config import settings
from app.core.logger import logger

class AIService:
    _cache: Dict[str, Dict[str, Any]] = {}
    _cooldown_until = 0.0
    CACHE_TTL = 3600
    PRIMARY_MODEL = "gemini-3.8-flash"
    FALLBACK_MODELS = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"]

    @classmethod
    def _get_api_keys(cls) -> List[str]:
        return [k.strip() for k in [settings.GEMINI_API_KEY, settings.GEMINI_API_KEY_2, settings.GEMINI_API_KEY_3] if k and k.strip()]

    @classmethod
    def _mark_unavailable(cls, duration_seconds: int = 15) -> None:
        cls._cooldown_until = time.time() + duration_seconds

    @classmethod
    def is_available(cls) -> bool:
        return (bool(cls._get_api_keys()) or bool(settings.DEEPSEEK_API_KEY and settings.DEEPSEEK_API_KEY.strip())) and time.time() >= cls._cooldown_until

    @classmethod
    def _call_deepseek(cls, prompt: str, system: str = "", is_json: bool = False) -> str:
        key = settings.DEEPSEEK_API_KEY
        if not key: return ""
        body: Dict[str, Any] = {"model": "deepseek-chat", "messages": ([{"role": "system", "content": system}] if system else []) + [{"role": "user", "content": prompt}], "temperature": 0.4, "stream": False}
        if is_json: body["response_format"] = {"type": "json_object"}
        try:
            req = urllib.request.Request("https://api.deepseek.com/v1/chat/completions", data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "Authorization": f"Bearer {key.strip()}"}, method="POST")
            with urllib.request.urlopen(req, timeout=20) as resp: return json.loads(resp.read().decode())["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"DeepSeek API call failed: {e}")
            return ""

    @classmethod
    def _extract_text_from_contents(cls, contents: Any) -> str:
        if isinstance(contents, str): return contents
        if isinstance(contents, list):
            out = []
            for item in contents:
                if isinstance(item, str): out.append(item)
                elif hasattr(item, "parts"): out.extend([getattr(p, "text", "") for p in item.parts if getattr(p, "text", None)])
                elif isinstance(item, dict): out.append(str(item.get("text") or item.get("content") or item))
            return "\n".join(out)
        return str(contents)

    @classmethod
    def _generate(cls, contents: Any, config_factory) -> Any:
        keys = cls._get_api_keys()
        last_exception = None
        for key in keys:
            client = genai.Client(api_key=key)
            for model in [cls.PRIMARY_MODEL] + cls.FALLBACK_MODELS:
                try:
                    return client.models.generate_content(model=model, contents=contents, config=config_factory(model))
                except Exception as exc:
                    last_exception = exc
                    logger.warning(f"Gemini model {model} failed: {exc}")
        if settings.DEEPSEEK_API_KEY:
            config = config_factory("deepseek")
            text = cls._call_deepseek(cls._extract_text_from_contents(contents), is_json=getattr(config, "response_mime_type", "") == "application/json")
            if text:
                class Wrapper:
                    def __init__(self, value): self.text = value
                return Wrapper(text)
        if last_exception: raise last_exception
        raise RuntimeError("No AI provider is configured")

    @classmethod
    def _clean_json_text(cls, text: str) -> str:
        text = (text or "{}").strip()
        if text.startswith("```"): text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"): text = text[:-3]
        start, end = text.find("{"), text.rfind("}")
        return text[start:end + 1] if start >= 0 and end > start else text

    @classmethod
    def _generate_json(cls, prompt: str, max_tokens: int = 8192, temp: float = 0.4, grounded: bool = False) -> Dict[str, Any]:
        def factory(_model: str):
            tools = [types.Tool(google_search=types.GoogleSearch())] if grounded and _model != "deepseek" else None
            return types.GenerateContentConfig(max_output_tokens=max_tokens, response_mime_type="application/json", tools=tools)
        response = cls._generate(prompt, factory)
        return json.loads(cls._clean_json_text(response.text or "{}"))

    @classmethod
    def chat(cls, messages: List[Dict[str, str]], system_instruction: str = "") -> str:
        contents = [types.Content(role=m["role"], parts=[types.Part.from_text(text=m["text"])]) for m in messages]
        def factory(_model: str): return types.GenerateContentConfig(system_instruction=system_instruction or None, max_output_tokens=4096)
        try: return cls._generate(contents, factory).text or ""
        except Exception as e:
            logger.error(f"AI chat failed: {e}")
            return "Sensei is temporarily unavailable. Your roadmap and progress are still safe."

    @classmethod
    def generate_smart_roadmap(cls, goal_title: str, target: str, daily_hours: float, timeline_days: int) -> Dict[str, Any]:
        timeline_days = max(7, min(int(timeline_days), 365))
        daily_minutes = max(30, int(float(daily_hours) * 60))
        target_low = (target or "").lower()
        directive = "Build toward measurable mastery and a concrete outcome."
        if "interview" in target_low: directive = "Prioritize interview patterns, timed drills, spaced repetition, mock interviews, and weak-area repair."
        elif "job" in target_low or "career" in target_low: directive = "Prioritize job-ready skills, production practices, portfolio evidence, and a final capstone."
        elif "launch" in target_low or "project" in target_low: directive = "Prioritize shipping: specification, architecture, implementation, testing, deployment, and polish."
        prompt = f"""You are myMentor's curriculum architect. Design a genuinely useful {timeline_days}-day learning plan, not a list of topics stretched over a calendar.
LEARNER GOAL: {goal_title}
OUTCOME / TARGET: {target}
DAILY TIME BUDGET: {daily_hours} hours ({daily_minutes} minutes)
PLAN LENGTH: exactly {timeline_days} days
DIRECTIVE: {directive}

RULES:
1. Return exactly {timeline_days} daily steps; one step is one meaningful day's work.
2. Never repeat a concept just to fill days. Repetition is only for Review, Retrieval, Practice, Mock or Capstone iteration.
3. Respect prerequisites and difficulty progression.
4. Each day should fit roughly within {daily_minutes} minutes; normal days use 1-3 resources.
5. Mix Learn, Practice, Build, Review and Assessment. For career targets include portfolio/capstone evidence.
6. Final 10-20% consolidates, assesses, repairs weak areas and completes the outcome.
7. Resources must be directly usable URLs when possible. Prefer official docs and reputable free resources. Never output Google search URLs.
8. For YouTube, provide a direct video/channel URL only when confident; otherwise prefer official docs.
9. Every resource requires title, category, platform, difficulty, estimated_time_mins, external_url and notes.
10. Use 3-5 tracks and modules. day_number is global 1..{timeline_days}.

Return JSON only: {{"title":"...","tracks":[{{"title":"...","description":"...","order":1,"modules":[{{"title":"...","description":"...","order":1,"steps":[{{"day_number":1,"title":"...","phase":"Learn|Practice|Build|Review|Assessment|Capstone","resources":[{{"title":"...","category":"Theory|Video|Project|Practice|Documentation|Assessment","platform":"...","difficulty":"Easy|Medium|Hard","estimated_time_mins":45,"external_url":"https://...","notes":"..."}}]}}]}}]}}]}}"""
        try:
            result = cls._generate_json(prompt, max_tokens=min(24000, max(10000, timeline_days * 420)), temp=0.25, grounded=True)
            return result if cls._roadmap_shape_is_usable(result, timeline_days) else {}
        except Exception as e:
            if any(x in str(e).lower() for x in ["429", "quota", "resource_exhausted"]): cls._mark_unavailable()
            logger.error(f"AI roadmap generation failed: {e}")
            return {}

    @classmethod
    def _roadmap_shape_is_usable(cls, roadmap: Dict[str, Any], timeline_days: int) -> bool:
        if not isinstance(roadmap, dict) or not roadmap.get("tracks"): return False
        days = []
        for track in roadmap.get("tracks", []):
            for module in track.get("modules", track.get("milestones", [])): days.extend(module.get("steps", []))
        numbers = {int(d.get("day_number")) for d in days if isinstance(d, dict) and str(d.get("day_number", "")).isdigit()}
        return len(days) >= max(7, int(timeline_days * 0.85)) and set(range(1, timeline_days + 1)).issubset(numbers)

    @classmethod
    def generate_roadmap_from_pdf(cls, goal_title: str, target: str, daily_hours: float, timeline_days: int, pdf_extracted_text: str) -> Dict[str, Any]:
        snippet = (pdf_extracted_text or "")[:12000]
        prompt = f"Create a {timeline_days}-day study plan from the supplied PDF. Goal: {goal_title}. Target: {target}. Daily time: {daily_hours} hours. Use only concepts supported by the PDF. Return exactly {timeline_days} daily steps with day_number 1..{timeline_days}, each with 1-3 resources whose total time fits the daily budget. JSON only.\n\nPDF:\n{snippet}"
        try:
            result = cls._generate_json(prompt, max_tokens=min(18000, max(8000, timeline_days * 300)), temp=0.25)
            return result if cls._roadmap_shape_is_usable(result, timeline_days) else {}
        except Exception as e:
            logger.error(f"AI PDF roadmap failed: {e}")
            return {}

    @classmethod
    def explain_topic(cls, topic: str, context: str = "", difficulty: str = "Medium") -> str:
        key = f"explain_{topic[:60]}_{difficulty}"
        cached = cls._cache.get(key)
        if cached and time.time() - cached["time"] < cls.CACHE_TTL: return cached["value"]
        value = cls.chat([{"role": "user", "text": f"Context: {context}\n\nExplain this at {difficulty} level: {topic}"}], "You are Sensei. Teach with intuition, example, common mistakes, and a short practice question.")
        cls._cache[key] = {"time": time.time(), "value": value}
        return value

    @classmethod
    def summarize_pdf_text(cls, text_content: str, filename: str) -> Dict[str, Any]:
        try: return cls._generate_json(f"Summarize {filename}. Return JSON with summary, key_concepts array and flashcards array of question/answer. Content:\n{text_content[:10000]}", max_tokens=4096, temp=0.3)
        except Exception: return {"summary": "AI service temporarily unavailable.", "key_concepts": [], "flashcards": []}

    @classmethod
    def get_daily_tip(cls, goal_title: str, current_topic: str = "", streak: int = 0) -> str:
        return cls.chat([{"role": "user", "text": f"Give a concise two-sentence study tip for {goal_title}. Current topic: {current_topic}. Streak: {streak} days."}], "You are Sensei, concise and practical.")

    @classmethod
    def summarize_and_extract_memory(cls, messages: List[Any], goal_title: str) -> Dict[str, Any]:
        transcript = "\n".join(f"{getattr(m, 'role', 'user')}: {getattr(m, 'text', '')}" for m in messages[-10:])
        try: return cls._generate_json(f"Extract strengths, weaknesses, preferences and progress_summary for goal {goal_title} from this transcript. JSON only.\n{transcript}", max_tokens=1024, temp=0.2)
        except Exception: return {}
