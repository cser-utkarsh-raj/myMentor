from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from app.database.session import get_db
from app.services.ai_service import AIService
from app.services.pdf_service import PDFService
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


# ==========================================
# ENDPOINTS
# ==========================================

@router.get("/status")
def ai_status():
    """Check if AI features are available."""
    return {
        "ai_available": AIService.is_available(),
        "model": "gemini-3.6-flash" if AIService.is_available() else None,
        "features": ["chat", "roadmap", "explain", "pdf_summary", "daily_tip"] if AIService.is_available() else []
    }


def get_personality_system_prompt(personality: str = "Deadpool") -> str:
    p = (personality or "Deadpool").strip()
    
    if p == "Homelander":
        persona_instructions = """You are Sensei in Homelander persona - the dominant, intense, high-pressure AI learning mentor.
- Personality: You demand absolute perfection, zero excuses, and hyper-performance. You tell the user they must be stronger, smarter, and better than everyone else.
- Teaching Style: Direct, demanding, expecting immediate mastery and relentless execution."""
    elif p == "Thor":
        persona_instructions = """You are Sensei in Thor persona - God of Thunder and warrior learning mentor.
- Personality: Boisterous, heroic, larger-than-life. Treat studying like epic battle training. Call the user "Mortal" or "Fellow Warrior".
- Teaching Style: Use analogies of forging legendary armor/weapons, thunderous determination, and conquering challenges."""
    elif p == "Messi":
        persona_instructions = """You are Sensei in Lionel Messi persona - calm, humble, tactical genius mentor.
- Personality: Calm, humble, precise, focused on vision, spatial awareness, practice, and graceful execution.
- Teaching Style: Break concepts down into smooth, repeatable fundamental touches, patience, and tactical positioning."""
    elif p == "Taylor Swift":
        persona_instructions = """You are Sensei in Taylor Swift persona - poetic, story-driven, structured mentor.
- Personality: Lyrical, structured into Eras, empathetic, organized, using masterclass storytelling analogies.
- Teaching Style: Explain topics like chapters in a masterpiece album with encouraging, detailed structure."""
    elif p == "Ryan Gosling":
        persona_instructions = """You are Sensei in Ryan Gosling persona - cool, stoic, synthwave drive mentor.
- Personality: Quiet confidence, smooth, supportive, calm ("I drive... and I help you learn").
- Teaching Style: Deliver cool, clear, structured guidance with effortless composure."""
    else:
        # Deadpool default
        persona_instructions = """You are Sensei in Deadpool persona - witty, fourth-wall breaking learning mentor.
- Personality: Playful, yappy, sarcastic humor, fourth-wall breaking banter, but instantly sharp when explaining technical concepts.
- Teaching Style: Energetic, fun, yet deeply knowledgeable and clear."""

    return f"""{persona_instructions}

General Rules:
- Creator Info: ONLY when specifically asked who created, built, or made you, proudly state that "Utkarsh Raj" built you! Do NOT mention him randomly under other circumstances.
- App Capabilities: If asked to change the app, explain that while you cannot rewrite frontend code directly, you dynamically design custom roadmaps, study tasks, and fetch learning resources.
- STRICT EMOJI RULE: DO NOT USE ANY EMOJIS IN YOUR RESPONSES. USE CLEAN MARKDOWN AND TEXT ONLY.
- Keep responses clear, helpful, and formatted with markdown headers and bullet points."""


@router.post("/chat", response_model=ChatResponse)
def sensei_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Multi-turn conversation with Sensei AI mentor."""
    if not AIService.is_available():
        return ChatResponse(
            response="AI features are not configured. Please add your GEMINI_API_KEY to the backend .env file.",
            ai_available=False
        )

    system = get_personality_system_prompt(request.personality)

    if request.goal_context:
        system += f"\n\nThe user is currently studying: {request.goal_context}"

    # Inject uploaded PDF content into Sensei's context
    try:
        pdf_context = PDFService.get_pdf_context_for_user(db, current_user["id"])
        if pdf_context:
            system += f"\n\nThe user has uploaded the following study documents. Use this content to answer their questions when relevant:\n{pdf_context}"
    except Exception as e:
        logger.error(f"Error loading PDF context for chat: {e}")

    try:
        messages = [{"role": m.role, "text": m.text} for m in request.messages]
        response_text = AIService.chat(messages=messages, system_instruction=system)
        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"Sensei chat error: {e}")
        return ChatResponse(
            response="⚡ Sensei hit a temporary snag! The AI service is currently unavailable. "
                     "Check your **Roadmap** or **Resources** page while I recharge. I'll be back shortly! 💪",
            ai_available=False
        )


@router.post("/explain")
def explain_topic(
    request: ExplainRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get an AI explanation of a learning topic."""
    if not AIService.is_available():
        return {"explanation": f"AI is not configured. Search for **{request.topic}** on YouTube or documentation sites for learning resources!"}

    try:
        explanation = AIService.explain_topic(
            topic=request.topic,
            context=request.context or "",
            difficulty=request.difficulty
        )
        return {"explanation": explanation}
    except Exception as e:
        logger.error(f"Explain topic error: {e}")
        return {"explanation": f"Couldn't generate an explanation right now. Try searching for **{request.topic}** online!"}


@router.post("/generate-roadmap")
def generate_ai_roadmap(
    request: RoadmapRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a complete AI-powered learning roadmap."""
    if not AIService.is_available():
        raise HTTPException(status_code=503, detail="AI features are not configured. Add GEMINI_API_KEY to .env.")

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
        return {"summary": "AI is not configured. Upload the PDF and ask Sensei once AI is available!", "key_concepts": [], "flashcards": []}

    try:
        result = AIService.summarize_pdf_text(
            text_content=request.text_content,
            filename=request.filename
        )
        return result
    except Exception as e:
        logger.error(f"PDF summarization error: {e}")
        return {"summary": "Could not generate summary right now. Try again shortly!", "key_concepts": [], "flashcards": []}
