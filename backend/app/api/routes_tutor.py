from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any, List

from backend.app.database.connection import get_db
from backend.app.ai.tutor import GroundedTutorService
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/tutor", tags=["Grounded AI Tutor"])


class TutorAskRequest(BaseModel):
    course_id: Optional[str] = "OS_101"
    message: str
    mode: Optional[str] = "beginner"  # beginner, exam, deep_dive, interview, socratic, bilingual
    language: Optional[str] = "en"
    scope: Optional[str] = "open"  # open or course
    conversation_id: Optional[str] = None
    response_depth: Optional[str] = "explanation"  # brief or explanation
    conversation_history: Optional[List[Dict[str, Any]]] = None
    enable_web_search: Optional[bool] = None


class SourceQuestionRequest(BaseModel):
    course_id: str
    document_id: str
    location: Dict[str, Any]  # {"page": 42} or {"slide": 18} or {"start_seconds": 1303}
    question: str
    mode: Optional[str] = "beginner"


@router.post("/ask")
async def ask_tutor(req: TutorAskRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Submits a query to the AI Tutor with zero application-level token or message limits.
    Supports general-purpose LLM reasoning, live web search, course-grounded RAG,
    dynamic 'Explore Further' follow-ups, and verified clickable citations.
    """
    # 1. Resolve active user (authenticated user via cookie/token or demo user fallback)
    user = None
    try:
        user = await AuthService.get_current_user_from_request(request, db)
    except Exception:
        pass

    if not user:
        user = await AuthService.get_or_create_demo_user(db)

    result = await GroundedTutorService.ask(
        db=db,
        course_id=req.course_id,
        query=req.message,
        mode=req.mode or "beginner",
        language=req.language or "en",
        scope=req.scope or "open",
        user_id=user.id,
        conversation_id=req.conversation_id,
        response_depth=req.response_depth or "explanation",
        conversation_history=req.conversation_history or [],
        enable_web_search=req.enable_web_search
    )
    return result


@router.post("/source-question")
async def ask_source_question(req: SourceQuestionRequest, db: AsyncSession = Depends(get_db)):
    """
    Implements Section 24 'Ask About This' mode scoped strictly to an exact page, slide, or video clip.
    """
    result = await GroundedTutorService.ask_source_question(
        db=db,
        course_id=req.course_id,
        document_id=req.document_id,
        location=req.location,
        query=req.question,
        mode=req.mode
    )
    return result
