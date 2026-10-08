from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any

from backend.app.database.connection import get_db
from backend.app.assessment.diagnostic_engine import DiagnosticAssessmentEngine
from backend.app.assessment.question_generator import AdaptiveQuestionGenerator
from backend.app.assessment.misconception_engine import MisconceptionEngine
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/assessment", tags=["Adaptive Assessment"])

class DiagnosticSubmitRequest(BaseModel):
    course_id: str
    submissions: List[Dict[str, Any]]
    learning_goal: Optional[str] = "Master Core Systems Concepts"

class GenerateQuestionsRequest(BaseModel):
    course_id: str
    topic_id: Optional[str] = None
    count: Optional[int] = 4

class SubmitAnswerRequest(BaseModel):
    question_id: str
    student_answer: str
    time_taken_seconds: Optional[int] = 30

@router.post("/diagnostic")
async def get_diagnostic(course_id: str, db: AsyncSession = Depends(get_db)):
    return await DiagnosticAssessmentEngine.create_diagnostic(db, course_id)

@router.post("/diagnostic/submit")
async def submit_diagnostic(req: DiagnosticSubmitRequest, db: AsyncSession = Depends(get_db)):
    demo_user = await AuthService.get_or_create_demo_user(db)
    return await DiagnosticAssessmentEngine.evaluate_diagnostic(
        db=db,
        user_id=demo_user.id,
        course_id=req.course_id,
        submissions=req.submissions,
        learning_goal=req.learning_goal
    )

@router.post("/generate")
async def generate_adaptive_questions(req: GenerateQuestionsRequest, db: AsyncSession = Depends(get_db)):
    demo_user = await AuthService.get_or_create_demo_user(db)
    questions = await AdaptiveQuestionGenerator.generate_questions_for_course(
        db=db,
        course_id=req.course_id,
        user_id=demo_user.id,
        topic_id=req.topic_id,
        count=req.count
    )
    return {"questions": questions}

@router.post("/submit")
async def submit_answer(req: SubmitAnswerRequest, db: AsyncSession = Depends(get_db)):
    demo_user = await AuthService.get_or_create_demo_user(db)
    result = await MisconceptionEngine.analyze_mistake(
        db=db,
        user_id=demo_user.id,
        question_id=req.question_id,
        student_answer=req.student_answer,
        time_taken_seconds=req.time_taken_seconds
    )
    return result
