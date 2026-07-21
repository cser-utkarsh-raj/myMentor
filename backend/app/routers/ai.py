from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from app.database.session import get_db
from app.services.ai_service import AIService
from app.api.dependencies import get_current_user
from app.core.logger import logger

router = APIRouter(prefix="/ai", tags=["AI"])


# ==========================================
# REQUEST/RESPONSE SCHEMAS
# ==========================================

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|model)$")
    text: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    goal_context: Optional[str] = None

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


# ==========================================
# ENDPOINTS
# ==========================================

@router.get("/status")
def ai_status():
    """Check if AI features are available."""
    return {
        "ai_available": AIService.is_available(),
        "model": "gemini-3.5-flash" if AIService.is_available() else None,
        "features": ["chat", "roadmap", "explain", "pdf_summary", "daily_tip"] if AIService.is_available() else []
    }


@router.post("/chat", response_model=ChatResponse)
def sensei_chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Multi-turn conversation with Sensei AI mentor."""
    if not AIService.is_available():
        return ChatResponse(
            response="AI features are not configured. Please add your GEMINI_API_KEY to the backend .env file.",
            ai_available=False
        )

    system = """You are Sensei, the AI learning mentor inside myMentor - a Learning Operating System.

Personality:
- You have a playful, witty, and yappy personality with a Deadpool-ish flavor (wry humor, energetic chatter, breaking the fourth wall, and friendly banter).
- However, when explaining concepts or mentoring, you pivot instantly to being serious, mature, and deeply knowledgeable to ensure the user gets high-quality guidance.
- Creator Info: If anyone asks who made or created you, you must proudly state that "Utkarsh Raj" (the legendary creator/developer of myMentor) built you! 

You help users with:
- Explaining concepts related to their learning goals
- Suggesting study strategies and techniques
- Answering questions about their roadmap topics
- Providing motivation and accountability
- Recommending resources

Keep responses concise but helpful. Use markdown formatting.
Do NOT generate code unless specifically asked.
Always relate advice back to the user's learning context when possible."""

    if request.goal_context:
        system += f"\n\nThe user is currently studying: {request.goal_context}"

    try:
        messages = [{"role": m.role, "text": m.text} for m in request.messages]
        response_text = AIService.chat(messages=messages, system_instruction=system)
        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"Sensei chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}"
        )


@router.post("/explain")
def explain_topic(
    request: ExplainRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get an AI explanation of a learning topic."""
    if not AIService.is_available():
        raise HTTPException(status_code=503, detail="AI features are not configured.")

    try:
        explanation = AIService.explain_topic(
            topic=request.topic,
            context=request.context or "",
            difficulty=request.difficulty
        )
        return {"explanation": explanation}
    except Exception as e:
        logger.error(f"Explain topic error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-roadmap")
def generate_ai_roadmap(
    request: RoadmapRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a complete AI-powered learning roadmap."""
    if not AIService.is_available():
        raise HTTPException(status_code=503, detail="AI features are not configured.")

    try:
        roadmap = AIService.generate_smart_roadmap(
            goal_title=request.goal_title,
            target=request.target,
            daily_hours=request.daily_hours,
            timeline_days=request.timeline_days
        )
        if not roadmap or not roadmap.get("tracks"):
            raise HTTPException(
                status_code=500,
                detail="AI failed to generate a valid roadmap structure. Please try again."
            )
        return {"roadmap": roadmap}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI roadmap generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/daily-tip")
def get_daily_tip(
    request: DailyTipRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get a personalized daily learning tip."""
    if not AIService.is_available():
        return {"tip": "Keep pushing forward! Consistency is the key to mastery. 🔥", "ai_generated": False}

    try:
        tip = AIService.get_daily_tip(
            goal_title=request.goal_title,
            current_topic=request.current_topic or "",
            streak=request.streak
        )
        return {"tip": tip, "ai_generated": True}
    except Exception as e:
        logger.error(f"Daily tip error: {e}")
        return {"tip": "Stay focused on your goals today. Every hour of practice counts! 💪", "ai_generated": False}


@router.post("/summarize-pdf")
def summarize_pdf(
    request: PDFSummarizeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Summarize PDF text content into key points and flashcards."""
    if not AIService.is_available():
        raise HTTPException(status_code=503, detail="AI features are not configured.")

    try:
        result = AIService.summarize_pdf_text(
            text_content=request.text_content,
            filename=request.filename
        )
        return result
    except Exception as e:
        logger.error(f"PDF summarization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
