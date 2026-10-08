from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from backend.app.database.connection import get_db
from backend.app.services.study_planner import StudyPlannerService
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/planner", tags=["Adaptive Study Planner"])

class GeneratePlanRequest(BaseModel):
    course_id: str
    target_date: Optional[str] = None  # YYYY-MM-DD
    daily_minutes: Optional[int] = 45

@router.get("")
async def get_plan(course_id: str, db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    return await StudyPlannerService.get_active_plan(db, user.id, course_id)

@router.post("/generate")
async def generate_plan(req: GeneratePlanRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    target_dt = datetime.strptime(req.target_date, "%Y-%m-%d") if req.target_date else None
    return await StudyPlannerService.generate_plan(
        db=db,
        user_id=user.id,
        course_id=req.course_id,
        target_exam_date=target_dt,
        daily_minutes=req.daily_minutes
    )

@router.post("/complete/{item_id}")
async def complete_item(item_id: str, db: AsyncSession = Depends(get_db)):
    return await StudyPlannerService.mark_item_completed(db, item_id)
