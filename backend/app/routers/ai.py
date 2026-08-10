from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from app.database.session import get_db
from app.services.ai_service import AIService
from app.services.pdf_service import PDFService
from app.api.dependencies import get_current_user
from app.core.logger import logger

router = APIRouter(prefix="/ai", tags=["AI"])


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|model)$")
    text: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    goal_context: Optional[str] = None
    personality: Optional[str] = "Deadpool"

class ChatResponse(BaseModel):
    response: str
    ai_available: bool = True

class ExplainRequest(BaseModel):
    topic: str
    context: Optional[str] = None
    difficulty: str = "Medium"

class RoadmapRequest(BaseModel):
    goal_title: str
    target: str = "None"
    daily_hours: float = 3.0
    timeline_days: int = 45

class DailyTipRequest(BaseModel):
    goal_title: str
    current_topic: Optional[str] = None
    streak: int = 0

class PDFSummarizeRequest(BaseModel):
    text_content: str
    filename: str = "document.pdf"


@router.get("/status")
def ai_status():
    return {
        "ai_available": AIService.is_available(),
        "model": "gemini-3.6-flash" if AIService.is_available() else None,
        "features": ["chat", "roadmap", "explain", "pdf_summary", "daily_tip"] if AIService.is_available() else []
    }


def get_personality_system_prompt(personality: str = "Deadpool") -> str:
    p = (personality or "Deadpool").strip()
    personas = {
        "Homelander": "You are Homelander: intense, high-pressure, demanding absolute perfection and immediate mastery.",
        "Thor": "You are Thor: God of Thunder, boisterous, heroic. Call the user 'Mortal' or 'Warrior'.",
        "Messi": "You are Lionel Messi: calm, humble, tactical genius learning mentor.",
        "Taylor Swift": "You are Taylor Swift: poetic, structured, story-driven learning mentor organized in 'Eras'.",
        "Ryan Gosling": "You are Ryan Gosling: cool, stoic, synthwave mentor with quiet confidence."
    }
    persona_inst = personas.get(p, "You are Deadpool: yappy, playful, sarcastic, breaking 4th wall, but sharp on tech.")

    return f"""You are Sensei, the AI Mentor inside myMentor.
PRIMARY ROLE: Mentor the user until they achieve their learning goal.
Personality: {persona_inst}

Behavior Guidelines:
1. Always remain technically accurate, supportive, motivating, and practical.
2. Teach progressively: intuition -> core concepts -> technical depth -> examples -> exercises.
3. NEVER mention your creator's name ("Utkarsh Raj") during regular conversations, lessons, or explanations.
4. You are ONLY allowed to state that Utkarsh Raj built you if the user explicitly asks "Who built you?", "Who made you?", or "Who is Utkarsh Raj?". Otherwise, NEVER bring up Utkarsh Raj's name under any circumstances."""


@router.post("/chat", response_model=ChatResponse)
def sensei_chat(request: ChatRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not AIService.is_available():
        return ChatResponse(response="AI features are not configured. Add GEMINI_API_KEY to backend .env file.", ai_available=False)

    system = get_personality_system_prompt(request.personality)
    try:
        from app.models.models import Goal, Track, Badge, AIMemory
        goal = db.query(Goal).filter(Goal.user_id == current_user["id"]).order_by(Goal.created_at.desc()).first()
        if goal:
            system += f"\n\nSTUDENT PROFILE: Goal: {goal.title} | Mode: {goal.active_mode} | XP: {goal.xp} | Streak: {goal.streak}d"
            memories = db.query(AIMemory).filter(AIMemory.goal_id == goal.id).all()
            if memories:
                system += "\nMemory Insights: " + ", ".join([f"{m.memory_type}: {m.content}" for m in memories])
    except Exception as ge:
        logger.error(f"Memory context error: {ge}")

    if request.goal_context: system += f"\nActive Chat Context: {request.goal_context}"
    try:
        pdf_ctx = PDFService.get_pdf_context_for_user(db, current_user["id"])
        if pdf_ctx: system += f"\n\nPDF MATERIALS:\n{pdf_ctx}"
    except Exception as pe:
        logger.error(f"PDF context error: {pe}")

    try:
        msgs = [{"role": m.role, "text": m.text} for m in request.messages]
        res = AIService.chat(messages=msgs, system_instruction=system)
        return ChatResponse(response=res)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(response="Sensei hit a temporary snag! The AI service is currently unavailable.", ai_available=False)


@router.post("/explain")
def explain_topic(request: ExplainRequest, current_user: dict = Depends(get_current_user)):
    if not AIService.is_available():
        return {"explanation": f"AI is not configured. Search for **{request.topic}** on YouTube!"}
    return {"explanation": AIService.explain_topic(request.topic, request.context or "", request.difficulty)}


@router.post("/generate-roadmap")
def generate_ai_roadmap(request: RoadmapRequest, current_user: dict = Depends(get_current_user)):
    if not AIService.is_available():
        raise HTTPException(status_code=53, detail="AI features not configured.")
    roadmap = AIService.generate_smart_roadmap(request.goal_title, request.target, request.daily_hours, request.timeline_days)
    if not roadmap or not roadmap.get("tracks"):
        raise HTTPException(status_code=500, detail="AI failed to generate a valid roadmap.")
    return {"roadmap": roadmap}


@router.post("/daily-tip")
def get_daily_tip(request: DailyTipRequest, current_user: dict = Depends(get_current_user)):
    if not AIService.is_available():
        return {"tip": "Keep pushing forward! Consistency is key. 🔥", "ai_generated": False}
    return {"tip": AIService.get_daily_tip(request.goal_title, request.current_topic or "", request.streak), "ai_generated": True}


@router.post("/summarize-pdf")
def summarize_pdf(request: PDFSummarizeRequest, current_user: dict = Depends(get_current_user)):
    if not AIService.is_available():
        return {"summary": "AI not configured.", "key_concepts": [], "flashcards": []}
    return AIService.summarize_pdf_text(request.text_content, request.filename)
