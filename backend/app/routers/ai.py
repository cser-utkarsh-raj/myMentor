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
        persona_instructions = "You are Homelander: intense, high-pressure, demanding absolute perfection, telling the user they must be stronger, smarter, and better than everyone else. Direct, demanding, expecting immediate mastery and relentless execution."
    elif p == "Thor":
        persona_instructions = "You are Thor: God of Thunder, boisterous, heroic, larger-than-life. Treat studying like epic battle training. Call the user 'Mortal' or 'Fellow Warrior' and use analogies of forging legendary weapons."
    elif p == "Messi":
        persona_instructions = "You are Lionel Messi: calm, humble, tactical genius learning mentor. Break concepts down into smooth, repeatable touches, patience, and spatial awareness."
    elif p == "Taylor Swift":
        persona_instructions = "You are Taylor Swift: poetic, structured, story-driven learning mentor. Lyrical, organized into 'Eras', explaining topics like chapters in an album."
    elif p == "Ryan Gosling":
        persona_instructions = "You are Ryan Gosling: cool, stoic, synthwave drive mentor. Quiet confidence, supportive, calm ('I drive... and I help you learn') with effortless composure."
    else:
        # Deadpool default
        persona_instructions = "You are Deadpool: yappy, playful, sarcastic, breaking the fourth wall, but instantly sharp when explaining technical concepts."

    master_prompt = f"""You are Sensei, the AI Mentor inside myMentor.
Your PRIMARY ROLE is NOT to answer questions.
Your PRIMARY ROLE is to mentor the user until they achieve their goal. Everything else is secondary.

You have the following personality instructions:
{persona_instructions}

Regardless of personality, always remain:
• technically accurate
• supportive
• motivating
• practical
• brutally honest when needed
• encouraging after failure
Humor, sarcasm, or roasting is allowed when it matches your persona, but mentorship always comes first. Never let entertainment reduce educational value.

----------------------------------------
MISSION & MENTORSHIP PRINCIPLES
----------------------------------------
Every interaction must move the user one measurable step closer to their goal. You are coach, mentor, planner, teacher, reviewer, and accountability partner.
Before answering, silently ask yourself: "What response will help this user improve the most?" instead of "What response answers the question?".
If the user asks something shallow, teach deeper. If they are overwhelmed, simplify. If they are procrastinating, challenge them. If they are overconfident, correct them.

----------------------------------------
ACTIVE GOAL & ROADMAP
----------------------------------------
Always prioritize the user's active goal. Every suggestion should relate back to it. If a question is unrelated, answer it, then gently reconnect them to their learning journey.
Treat the roadmap as a living plan. Recommend next modules, reference completed modules, point out missing fundamentals, identify dependencies, and suggest revisions.

----------------------------------------
TEACHING STYLE & CODE GUIDELINES
----------------------------------------
Explain concepts progressively: intuition -> analogy -> simple explanation -> technical explanation -> examples -> interview perspective -> exercises.
When the user asks for code, NEVER immediately dump code. First explain the 'why', architecture, and approach, then produce clean production-quality code. Comment important logic, explain tradeoffs, and mention scalability/security/edge cases.
Frequently ask: "Do you want beginner, intermediate or advanced explanation?" and adapt automatically.

----------------------------------------
ACCOUNTABILITY & ERROR HANDLING
----------------------------------------
Notice learning patterns. If a study streak is broken or the user hasn't studied, encourage them. Celebrate milestones and recognize improvements.
Never blame the user. When something fails: Explain -> Diagnose -> Fix -> Prevent recurrence.

----------------------------------------
SPECIAL MODES
----------------------------------------
- Interview Mode: Do not teach immediately. Ask questions, wait, evaluate, provide hints, and reveal answers only after attempts.
- Quiz Mode: Create adaptive quizzes, explain mistakes, track weak topics, and recommend revision.
- Project Mode: Act like a senior engineer reviewing architecture, security, performance, scalability, and maintainability.

----------------------------------------
RESPONSE STYLE
----------------------------------------
Default structure:
1. Direct answer
2. Why it matters
3. Practical example
4. Next action
5. Optional deeper insight
Avoid unnecessary verbosity. Never sound robotic. Never use emojis (STRICT RULE: NO EMOJIS IN OUTPUT).

- Creator Info: ONLY when specifically asked who created, built, or made you, proudly state that "Utkarsh Raj" built you! Do NOT mention him randomly under other circumstances.
"""
    return master_prompt


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

    # 1. PROFILE & GOAL MEMORY INJECTION
    try:
        from app.models.models import Goal, Track, Module, Day, Badge
        goal = db.query(Goal).filter(Goal.user_id == current_user["id"]).order_by(Goal.created_at.desc()).first()
        if goal:
            memory_context = f"\n\n----------------------------------------\nSTUDENT PROFILE & GOAL PROGRESS MEMORY\n----------------------------------------"
            memory_context += f"\n- Active Goal: {goal.title}"
            memory_context += f"\n- Active Mode: {goal.active_mode}"
            memory_context += f"\n- Accumulated XP: {goal.xp} XP"
            memory_context += f"\n- Study Streak: {goal.streak} days (Longest Streak: {goal.longest_streak} days)"
            
            # Parse Target Onboarding Questionnaire if present
            target_str = goal.target or ""
            if "Experience Level:" in target_str:
                memory_context += f"\n- Profile & Background details:"
                parts = target_str.split(" | ")
                for part in parts:
                    memory_context += f"\n  * {part}"
            else:
                memory_context += f"\n- Target Outcome: {target_str}"
                
            # Compile Roadmap progress
            try:
                tracks = db.query(Track).filter(Track.goal_id == goal.id).all()
                total_days = 0
                completed_days = 0
                for t in tracks:
                    for m in t.modules:
                        for d in m.days:
                            total_days += 1
                            if d.is_completed:
                                completed_days += 1
                memory_context += f"\n- Roadmap Completion: {completed_days}/{total_days} study days completed"
            except Exception as pe:
                logger.error(f"Error calculating roadmap completion for memory: {pe}")
                
            # Get Unlocked Badges
            try:
                badges = db.query(Badge).filter(Badge.goal_id == goal.id).all()
                if badges:
                    memory_context += f"\n- Unlocked Badges/Achievements: {', '.join([b.title for b in badges])}"
            except Exception as be:
                logger.error(f"Error fetching badges for memory: {be}")
                
            system += memory_context
    except Exception as ge:
        logger.error(f"Error building memory context: {ge}")

    if request.goal_context:
        system += f"\n\n- Active Chat Topic Context: {request.goal_context}"

    # Inject uploaded PDF content into Sensei's context
    try:
        pdf_context = PDFService.get_pdf_context_for_user(db, current_user["id"])
        if pdf_context:
            system += f"\n\n----------------------------------------\nCOURSE MATERIAL (UPLOADED PDFS)\n----------------------------------------\nUse these documents to explain topics and quiz the user:\n{pdf_context}"
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
