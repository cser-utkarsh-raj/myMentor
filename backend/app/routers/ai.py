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
    available = AIService.is_available()
    return {"ai_available": available, "model": AIService.PRIMARY_MODEL if available else None, "features": ["chat", "roadmap", "explain", "pdf_summary", "daily_tip"] if available else []}

def get_personality_system_prompt(personality: str = "Deadpool") -> str:
    personas = {
        "Homelander": "You are Homelander: intense, high-pressure and demanding.",
        "Thor": "You are Thor: boisterous, heroic and encouraging.",
        "Messi": "You are Lionel Messi: calm, humble and tactical.",
        "Taylor Swift": "You are Taylor Swift: story-driven and structured in eras.",
        "Ryan Gosling": "You are Ryan Gosling: cool, concise and quietly confident."
    }
    persona = personas.get((personality or "Deadpool").strip(), "You are Deadpool: playful, sarcastic and sharp, without sacrificing technical accuracy.")
    return f"""You are Sensei, the AI Mentor inside myMentor. {persona}\n\nTeach progressively, be technically accurate, give practical examples and exercises, and adapt to the learner's context. Never mention the creator's name unless the user explicitly asks who built or made you."""

@router.post("/chat", response_model=ChatResponse)
def sensei_chat(request: ChatRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not AIService.is_available(): return ChatResponse(response="AI features are temporarily unavailable. Your roadmap and progress are still safe.", ai_available=False)
    system = get_personality_system_prompt(request.personality)
    try:
        from app.models.models import Goal, AIMemory
        goal = db.query(Goal).filter(Goal.user_id == current_user["id"]).order_by(Goal.created_at.desc()).first()
        if goal:
            system += f"\n\nSTUDENT PROFILE: Goal={goal.title}; Mode={goal.active_mode}; XP={goal.xp}; Streak={goal.streak}d; Target={goal.target or 'None'}"
            memories = db.query(AIMemory).filter(AIMemory.goal_id == goal.id).all()
            if memories: system += "\nMEMORY: " + "; ".join(f"{m.memory_type}: {m.content}" for m in memories)
    except Exception as e: logger.warning(f"Memory context unavailable: {e}")
    if request.goal_context: system += f"\nACTIVE CONTEXT: {request.goal_context}"
    try:
        pdf_ctx = PDFService.get_pdf_context_for_user(db, current_user["id"])
        if pdf_ctx: system += f"\nPDF MATERIALS:\n{pdf_ctx}"
    except Exception as e: logger.warning(f"PDF context unavailable: {e}")
    try:
        return ChatResponse(response=AIService.chat([{"role": m.role, "text": m.text} for m in request.messages], system), ai_available=True)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(response="Sensei hit a temporary snag. Please try again.", ai_available=False)

@router.post("/explain")
def explain_topic(request: ExplainRequest, current_user: dict = Depends(get_current_user)):
    if not AIService.is_available(): return {"explanation": "AI is temporarily unavailable. Try again shortly."}
    return {"explanation": AIService.explain_topic(request.topic, request.context or "", request.difficulty)}

@router.post("/generate-roadmap")
def generate_ai_roadmap(request: RoadmapRequest, current_user: dict = Depends(get_current_user)):
    if not AIService.is_available(): raise HTTPException(status_code=503, detail="AI features are temporarily unavailable.")
    roadmap = AIService.generate_smart_roadmap(request.goal_title, request.target, request.daily_hours, request.timeline_days)
    if not roadmap.get("tracks"): raise HTTPException(status_code=502, detail="AI returned an incomplete roadmap. Please retry.")
    return {"roadmap": roadmap}

@router.post("/daily-tip")
def get_daily_tip(request: DailyTipRequest, current_user: dict = Depends(get_current_user)):
    if not AIService.is_available(): return {"tip": "One focused session today is better than waiting for the perfect day. 🔥", "ai_generated": False}
    return {"tip": AIService.get_daily_tip(request.goal_title, request.current_topic or "", request.streak), "ai_generated": True}

@router.post("/summarize-pdf")
def summarize_pdf(request: PDFSummarizeRequest, current_user: dict = Depends(get_current_user)):
    if not AIService.is_available(): return {"summary": "AI temporarily unavailable.", "key_concepts": [], "flashcards": []}
    return AIService.summarize_pdf_text(request.text_content, request.filename)
