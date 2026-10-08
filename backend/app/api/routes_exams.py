from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional

from backend.app.database.connection import get_db
from backend.app.services.exam_simulator import ExamSimulatorService
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/exams", tags=["Exam Simulator"])

class SubmitExamRequest(BaseModel):
    course_id: str
    answers: List[Dict[str, Any]]

@router.post("/generate")
async def generate_mock_exam(course_id: str, duration: Optional[int] = 15, count: Optional[int] = 6, db: AsyncSession = Depends(get_db)):
    return await ExamSimulatorService.create_exam(db, course_id, duration, count)

@router.post("/submit")
async def submit_exam(req: SubmitExamRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    return await ExamSimulatorService.submit_exam(db, user.id, req.course_id, req.answers)
