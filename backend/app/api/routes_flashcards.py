from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.app.database.connection import get_db
from backend.app.services.flashcards import FlashcardService
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/flashcards", tags=["Spaced Repetition Flashcards"])

class FlashcardReviewRequest(BaseModel):
    flashcard_id: str
    quality: int  # 0 to 5 (SM-2 scale)
    time_taken_ms: Optional[int] = 4000

@router.get("/due")
async def get_due_flashcards(course_id: str, db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    cards = await FlashcardService.get_due_flashcards(db, user.id, course_id)
    return {"due_count": len(cards), "cards": cards}

@router.post("/review")
async def review_card(req: FlashcardReviewRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    return await FlashcardService.review_card(
        db=db,
        user_id=user.id,
        flashcard_id=req.flashcard_id,
        quality=req.quality,
        time_taken_ms=req.time_taken_ms
    )
