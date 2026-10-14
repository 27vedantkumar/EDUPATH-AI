from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any

from backend.app.database.connection import get_db
from backend.app.services.gamification import GamificationService
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/games", tags=["Educational Mini-Games"])


class AwardGameXPRequest(BaseModel):
    game_type: str
    score: int


@router.get("")
@router.get("/")
async def list_all_games():
    """Returns directory of all 10 Learning Arcade games."""
    return GamificationService.list_games()


@router.get("/{game_type}")
async def get_game_data(game_type: str):
    """Retrieves full interactive payload for a specific arcade game."""
    return GamificationService.get_game_data(game_type)


@router.post("/award-xp")
async def award_game_xp(req: AwardGameXPRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Awards gamification XP and checks for level-ups on game completion."""
    user = None
    try:
        user = await AuthService.get_current_user_from_request(request, db)
    except Exception:
        pass

    if not user:
        user = await AuthService.get_or_create_demo_user(db)

    xp_to_award = min(50, max(10, req.score // 2))
    return await GamificationService.award_xp(
        db=db,
        user_id=user.id,
        amount=xp_to_award,
        reason=f"Completed {req.game_type} challenge with score {req.score}"
    )
