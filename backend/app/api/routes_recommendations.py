from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.connection import get_db
from backend.app.services.adaptive_learning_engine import AdaptiveLearningEngine
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/recommendations", tags=["Adaptive Recommendations"])

@router.get("")
async def get_recommendations(course_id: str, db: AsyncSession = Depends(get_db)):
    """
    Implements Deliverables 21 & 96: GET /api/recommendations.
    Returns explainable next best learning actions.
    """
    user = await AuthService.get_or_create_demo_user(db)
    return await AdaptiveLearningEngine.get_next_best_action(db, user.id, course_id)
