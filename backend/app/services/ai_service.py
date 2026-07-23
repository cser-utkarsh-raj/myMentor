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
        "gemini-2.0-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        "gemini-3.1-flash-lite"
    ]

    @classmethod
    def _get_api_key(cls) -> Optional[str]:
        return settings.GEMINI_API_KEY

    @classmethod
    def _get_client(cls):
        api_key = cls._get_api_key()
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")
        if cls._client is None:
            cls._client = genai.Client(api_key=api_key)
        return cls._client

    @classmethod
    def _mark_unavailable(cls, duration_seconds: int = 15) -> None:
        cls._cooldown_until = time.time() + duration_seconds

    @classmethod
    def is_available(cls) -> bool:
        return bool(cls._get_api_key()) and time.time() >= cls._cooldown_until

    @classmethod
    def _get_cached(cls, key: str) -> Optional[str]:
        """Return cached response if still valid, else None."""
        entry = cls._cache.get(key)
        if entry and (time.time() - entry["timestamp"]) < cls.CACHE_TTL:
            return entry["response"]
        return None

    @classmethod
    def _set_cache(cls, key: str, value: str):
        """Store response in cache with current timestamp."""
        cls._cache[key] = {"response": value, "timestamp": time.time()}

    @classmethod
    def _fallback_response(cls) -> str:
        """Friendly fallback when AI is unavailable without emojis."""
        return (
            "Sensei's AI brain is temporarily on cooldown — the AI service hit a snag. "
            "This happens occasionally with API rate limits or network connectivity.\n\n"
            "Do not worry, I will be back shortly! In the meantime, check out your **Roadmap** "
            "for today's tasks, or browse the **Resources** page for study materials. Keep pushing forward!"
        )

    @classmethod
    def _generate(cls, contents: Any, config: Any) -> Any:
        client = cls._get_client()
        last_exception = None
        for model in [cls.PRIMARY_MODEL] + cls.FALLBACK_MODELS:
            try:
                return client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
            except Exception as e:
                last_exception = e
                logger.warning(f"Gemini model '{model}' failed: {e}. Trying next fallback model...")
                time.sleep(0.5)

        if last_exception:
            raise last_exception
        raise RuntimeError("All Gemini models failed")

    @classmethod
    def chat(cls, messages: List[Dict[str, str]], system_instruction: str = "") -> str:
        """
        Send a multi-turn conversation to Gemini and get a response.
        messages: list of {"role": "user"|"model", "text": "..."}
        Returns fallback string on any error instead of raising.
        """
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
            response = cls._generate(contents=contents, config=config)
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini API error in chat: {e}")
            return cls._fallback_response()

    @classmethod
    def generate_smart_roadmap(cls, goal_title: str, target: str, daily_hours: float, timeline_days: int) -> Dict[str, Any]:
        """
        Generate a complete learning roadmap using AI.
        Returns a structured JSON roadmap.
        """
        target_lower = target.lower()
        target_directive = ""
        if "interview" in target_lower:
            target_directive = (
                "CRITICAL TARGET DIRECTIVE: THE USER'S PRIMARY TARGET IS INTERVIEW PREPARATION. "
                "Structure the entire roadmap specifically for technical interview questions, coding speed drills, "
                "system design interview rounds, LeetCode problem sets, and mock interview questions."
            )
        elif "job" in target_lower or "career" in target_lower or "transition" in target_lower:
            target_directive = (
                "CRITICAL TARGET DIRECTIVE: THE USER'S PRIMARY TARGET IS CAREER TRANSITION & GETTING A JOB. "
                "Structure the roadmap around production-ready capstone projects, portfolio building, "
                "enterprise industry standards, and resume-ready deliverables."
            )
        elif "launch" in target_lower or "project" in target_lower or "fun" in target_lower:
            target_directive = (
                "CRITICAL TARGET DIRECTIVE: THE USER'S PRIMARY TARGET IS BUILDING A SIDE PROJECT & FAST LAUNCH. "
                "Structure the roadmap with zero unnecessary theory fluff—focus 100% on rapid hands-on building, "
                "practical component scaffolding, and shipping working features quickly."
            )
        elif "mastery" in target_lower or "learning" in target_lower:
            target_directive = (
                "CRITICAL TARGET DIRECTIVE: THE USER'S PRIMARY TARGET IS DEEP CORE SKILL MASTERY. "
                "Structure an extensive, thorough curriculum covering foundational theory, underlying mechanics, "
                "architecture deep-dives, and advanced technical edge-cases."
            )

        prompt = f"""You are an expert learning architect. Create a detailed, structured learning roadmap.

Goal: {goal_title}
Target Outcome: {target}
Daily Study Hours: {daily_hours}
Total Timeline: {timeline_days} days

{target_directive}

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
- Create exactly 3 tracks covering different core aspects of the goal: {goal_title}
- Each track should have 1-2 modules
- Each module should have 1-2 steps
- Keep the total count of steps across the entire roadmap between 6 and 10. The backend will automatically scale these steps to fit the user's {timeline_days}-day timeline.
- NEVER include generic placeholder steps like "Planning Phase", "Initial Setup", "Set Up Workspace", or "Define Scope". Start immediately with real, core subject matter topics for {goal_title}.
- Steps should have 1-2 resources each
- Resources must be specific to {goal_title}
- Scale difficulty progressively from Easy to Hard
- Align content strictly with the TARGET DIRECTIVE above
- Content must be specific and actionable, not generic placeholder templates

Return ONLY valid JSON, no markdown formatting, no code blocks."""

        try:
            config = types.GenerateContentConfig(
                temperature=0.6,
                max_output_tokens=8192,
                response_mime_type="application/json",
            )
            response = cls._generate(contents=prompt, config=config)
            result_text = (response.text or "{}").strip()
            # Remove markdown code block fences if present
            if result_text.startswith("```"):
                first_newline = result_text.find("\n")
                if first_newline != -1:
                    result_text = result_text[first_newline:].strip()
                if result_text.endswith("```"):
                    result_text = result_text[:-3].strip()
            return json.loads(result_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI roadmap JSON: {e}")
            return {}
        except Exception as e:
            message = str(e).lower()
            if "429" in message or "quota" in message or "resource_exhausted" in message:
                cls._mark_unavailable()
            logger.error(f"AI roadmap generation failed: {e}")
            return {}

    @classmethod
    def explain_topic(cls, topic: str, context: str = "", difficulty: str = "Medium") -> str:
        """Explain a learning topic in the context of the user's goal."""
        # Check cache
        cache_key = f"explain_{topic[:50]}_{difficulty}"
        cached = cls._get_cached(cache_key)
        if cached:
            return cached

        system = f"""You are Sensei, a friendly and knowledgeable learning mentor inside the myMentor app.
You explain concepts clearly with examples. Adjust your explanation depth based on difficulty level: {difficulty}.
If context about the user's learning goal is provided, relate explanations to their specific journey.
Keep responses concise but thorough. Use markdown formatting for readability."""
        
        user_msg = topic
        if context:
            user_msg = f"Context: I'm currently learning {context}.\n\nQuestion: {topic}"

        try:
            result = cls.chat(
                messages=[{"role": "user", "text": user_msg}],
                system_instruction=system
            )
            cls._set_cache(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Explain topic failed: {e}")
            return f"I couldn't generate an explanation right now, but here's a tip: search for **{topic}** on YouTube or documentation sites for great learning resources!"

    @classmethod
    def summarize_pdf_text(cls, text_content: str, filename: str) -> Dict[str, Any]:
        """Summarize extracted PDF text into key points and flashcards."""
        # Check cache
        cache_key = f"pdf_summary_{filename}"
        cached = cls._get_cached(cache_key)
        if cached:
            try:
                return json.loads(cached)
            except Exception:
                pass

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

        config = types.GenerateContentConfig(
            temperature=0.6,
            max_output_tokens=4096,
            response_mime_type="application/json"
        )
        try:
            response = cls._generate(contents=prompt, config=config)
            result_text = (response.text or "{}").strip()
            # Remove markdown code block fences if present
            if result_text.startswith("```"):
                first_newline = result_text.find("\n")
                if first_newline != -1:
                    result_text = result_text[first_newline:].strip()
                if result_text.endswith("```"):
                    result_text = result_text[:-3].strip()
            parsed = json.loads(result_text)
            cls._set_cache(cache_key, result_text)
            return parsed
        except Exception as e:
            logger.error(f"PDF summarization failed: {e}")
            return {"summary": "Could not generate summary — the AI service is temporarily unavailable. Try again in a few minutes.", "key_concepts": [], "flashcards": []}

    @classmethod
    def get_daily_tip(cls, goal_title: str, current_topic: str = "", streak: int = 0) -> str:
        """Generate a personalized daily learning tip."""
        # Check cache
        cache_key = f"daily_tip_{goal_title}_{streak}"
        cached = cls._get_cached(cache_key)
        if cached:
            return cached

        prompt = f"""Generate a short, motivational daily learning tip (2-3 sentences max) for someone studying \"{goal_title}\".
Their current streak is {streak} days.
{f'They are currently working on: {current_topic}.' if current_topic else ''}
Make it specific, actionable, and encouraging. No generic platitudes."""

        try:
            result = cls.chat(
                messages=[{"role": "user", "text": prompt}],
                system_instruction="You are Sensei, a concise learning mentor. Give short, punchy tips."
            )
            cls._set_cache(cache_key, result)
            return result
        except Exception as e:
            logger.error(f"Daily tip generation failed: {e}")
            return "Keep pushing forward! Consistency is the key to mastery. Every session compounds over time. 🔥"

    @classmethod
    def summarize_and_extract_memory(cls, messages: List[Any], goal_title: str) -> Dict[str, Any]:
        """
        Analyze recent chat messages and extract memory insights
        (strengths, weaknesses, preferences, progress_summary).
        """
        chat_transcript = ""
        for m in messages[-10:]:
            role = getattr(m, 'role', m.get('role', 'user') if isinstance(m, dict) else 'user')
            text = getattr(m, 'text', m.get('text', '') if isinstance(m, dict) else '')
            chat_transcript += f"{role}: {text}\n"

        prompt = f"""You are an AI learning architect monitoring a student studying: "{goal_title}".
Analyze the following recent conversation history between the student and their mentor, and compile their profile state.
Identify:
1. Strengths: Concepts or skills the student grasps well.
2. Weaknesses: Concepts, APIs, or issues the student is struggling with or has questions about.
3. Preferences: Learning styles, favorite personalities, or technical choices mentioned.
4. Progress Summary: A 1-2 sentence overview of what was covered and what the next lesson/step should focus on.

Format your response as a valid JSON object:
{{
  "strengths": "...",
  "weaknesses": "...",
  "preferences": "...",
  "progress_summary": "..."
}}

Conversation history:
{chat_transcript}

Return ONLY valid JSON."""

        try:
            config = types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=1024,
                response_mime_type="application/json"
            )
            response = cls._generate(contents=prompt, config=config)
            result_text = (response.text or "{}").strip()
            # Remove markdown code fences if present
            if result_text.startswith("```"):
                first_newline = result_text.find("\n")
                if first_newline != -1:
                    result_text = result_text[first_newline:].strip()
                if result_text.endswith("```"):
                    result_text = result_text[:-3].strip()
            return json.loads(result_text)
        except Exception as e:
            logger.error(f"Failed to extract memory from conversation: {e}")
            return {}
