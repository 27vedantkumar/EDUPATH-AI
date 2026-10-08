from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional, List

from backend.app.database.connection import get_db
from backend.app.models.entities import User, LearnerProfile, TopicMastery, ConceptMastery, Topic
from backend.app.learner.mastery_service import LearnerMasteryService
from backend.app.learner.timeline_service import LearningTimelineService
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/learner", tags=["Learner Model & Mastery"])

@router.get("/profile")
async def get_profile(db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    res = await db.execute(select(LearnerProfile).filter(LearnerProfile.user_id == user.id))
    profile = res.scalars().first()
    if not profile:
        profile = LearnerProfile(user_id=user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return {
        "user_id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "overall_mastery": profile.overall_mastery,
        "mastery_status": LearnerMasteryService.get_status_label(profile.overall_mastery),
        "learning_goal": profile.learning_goal,
        "xp_points": profile.xp_points,
        "level": profile.level,
        "current_streak_days": profile.current_streak_days,
        "total_study_minutes": profile.total_study_minutes,
        "preferred_mode": profile.preferred_mode
    }

@router.get("/mastery")
async def get_mastery_breakdown(db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    
    # Topic masteries
    t_res = await db.execute(select(TopicMastery).filter(TopicMastery.user_id == user.id))
    topic_masteries = t_res.scalars().all()
    
    topics_data = []
    for tm in topic_masteries:
        topic = await db.get(Topic, tm.topic_id)
        topics_data.append({
            "topic_id": tm.topic_id,
            "topic_name": topic.name if topic else "Topic",
            "mastery_score": tm.mastery_score,
            "status": tm.status,
            "recent_accuracy": tm.recent_accuracy,
            "attempts": tm.attempts_count
        })

    return {
        "user_id": user.id,
        "topics": topics_data
    }

@router.get("/timeline")
async def get_timeline(db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    return await LearningTimelineService.get_user_timeline(db, user.id)

@router.get("/why-am-i-weak/{topic_id}")
async def get_why_am_i_weak(topic_id: str, db: AsyncSession = Depends(get_db)):
    user = await AuthService.get_or_create_demo_user(db)
    return await LearnerMasteryService.get_why_am_i_weak_analysis(db, user.id, topic_id)
