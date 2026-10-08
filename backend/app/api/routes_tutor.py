from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any, List

from backend.app.database.connection import get_db
from backend.app.ai.tutor import GroundedTutorService
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/tutor", tags=["Grounded AI Tutor"])

class TutorAskRequest(BaseModel):
    course_id: str
    message: str
    mode: Optional[str] = "beginner"  # beginner, exam, deep_dive, interview, socratic, bilingual
    language: Optional[str] = "en"
    scope: Optional[str] = "course"  # course or open
    conversation_id: Optional[str] = None

class SourceQuestionRequest(BaseModel):
    course_id: str
    document_id: str
    location: Dict[str, Any]  # {"page": 42} or {"slide": 18} or {"start_seconds": 1303}
    question: str
    mode: Optional[str] = "beginner"

@router.post("/ask")
async def ask_tutor(req: TutorAskRequest, db: AsyncSession = Depends(get_db)):
    """
    Submits a grounded query to the AI Tutor.
    Enforces hybrid retrieval, grounding gate validation, and citation tracking.
    """
    # Use demo user by default if session token not provided
    demo_user = await AuthService.get_or_create_demo_user(db)
    
    result = await GroundedTutorService.ask(
        db=db,
        course_id=req.course_id,
        query=req.message,
        mode=req.mode,
        language=req.language,
        scope=req.scope,
        user_id=demo_user.id,
        conversation_id=req.conversation_id
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
