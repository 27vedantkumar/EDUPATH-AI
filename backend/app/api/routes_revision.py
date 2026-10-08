from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.app.database.connection import get_db
from backend.app.services.revision_generator import RevisionGeneratorService
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/revision", tags=["Revision Generator"])

@router.get("/quick")
async def get_quick_revision(course_id: str, topic_name: Optional[str] = "Deadlocks", db: AsyncSession = Depends(get_db)):
    return await RevisionGeneratorService.generate_quick_revision(db, course_id, topic_name)

@router.get("/cheat-sheet")
async def get_cheat_sheet(course_id: str, db: AsyncSession = Depends(get_db)):
    return await RevisionGeneratorService.generate_exam_cheat_sheet(db, course_id)

@router.get("/weak-areas")
async def get_weak_areas(course_id: str, db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    return await RevisionGeneratorService.generate_weak_area_revision(db, user.id, course_id)
