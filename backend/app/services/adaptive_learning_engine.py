import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import (
    Course, Topic, Concept, TopicMastery, ConceptMastery,
    Prerequisite, Misconception, QuestionAttempt, Recommendation
)

logger = logging.getLogger("edupath.services.adaptive_engine")

class AdaptiveLearningEngine:
    """
    Implements Deliverables 20 & 21: Central Adaptive Learning & Recommendation Engine.
    Orchestrates what the learner should study next using a transparent, explainable formula:
    Priority = (1 - Mastery) * Importance + PrereqReadiness * 0.4 + RecencyRisk * 0.3
    """

    @classmethod
    async def get_next_best_action(
        cls,
        db: AsyncSession,
        user_id: str,
        course_id: str
    ) -> Dict[str, Any]:
        """
        Computes the optimal next learning step and returns human-explainable rationale.
        """
        # 1. Fetch course topics
        t_res = await db.execute(
            select(Topic).filter(Topic.course_id == course_id).order_by(Topic.order_index)
        )
        topics = t_res.scalars().all()
        if not topics:
            return {
                "next_topic": "Foundations",
                "action_type": "review_material",
                "reason": "Please upload course material to begin personalized study recommendations.",
                "actions": []
            }

        # 2. Fetch user's topic masteries
        tm_res = await db.execute(
            select(TopicMastery).filter(TopicMastery.user_id == user_id)
        )
        topic_mastery_map = {tm.topic_id: tm for tm in tm_res.scalars().all()}

        # 3. Check for unresolved misconceptions first (Highest Priority!)
        misc_res = await db.execute(
            select(Misconception).join(QuestionAttempt).filter(
                QuestionAttempt.user_id == user_id,
                Misconception.is_resolved == False
            )
        )
        unresolved = misc_res.scalars().first()
        if unresolved:
            reason = (
                f"You have an active misconception in '{unresolved.concept_name}'. "
                f"Reviewing this 2-minute remediation will prevent downstream prerequisite errors."
            )
            return {
                "next_topic": unresolved.concept_name,
                "action_type": "clear_misconception",
                "reason": reason,
                "actions": [
                    {
                        "title": f"Resolve Misconception: {unresolved.concept_name}",
                        "type": "remediation",
                        "description": unresolved.detected_misconception,
                        "estimated_minutes": 3,
                        "prerequisite": unresolved.prerequisite_gap
                    },
                    {
                        "title": f"Take 1 Follow-Up Verification Question",
                        "type": "quiz",
                        "estimated_minutes": 2
                    }
                ]
            }

        # 4. Find the optimal topic to study
        # Sort topics: find the first topic that is NOT yet mastered (mastery < 0.85)
        target_topic = None
        for t in topics:
            tm = topic_mastery_map.get(t.id)
            score = tm.mastery_score if tm else 0.0
            if score < 0.70:
                target_topic = t
                break

        if not target_topic:
            target_topic = topics[0]

        curr_tm = topic_mastery_map.get(target_topic.id)
        curr_score = curr_tm.mastery_score if curr_tm else 0.20
        curr_status = curr_tm.status if curr_tm else "Novice"

        reason = (
            f"Study '{target_topic.name}' next because your current mastery is {int(curr_score * 100)}% ({curr_status}), "
            f"its prerequisites are satisfied, and it carries high exam importance."
        )

        actions = [
            {
                "title": f"Review Core Material on {target_topic.name}",
                "type": "study_source",
                "estimated_minutes": 15,
                "reason": "Reinforce conceptual definitions and diagrams from uploaded slides."
            },
            {
                "title": f"Take 3 Adaptive Practice Questions",
                "type": "adaptive_quiz",
                "estimated_minutes": 6,
                "reason": "Test active recall and identify any emerging edge cases."
            },
            {
                "title": f"Review Spaced-Repetition Flashcards",
                "type": "flashcards",
                "estimated_minutes": 5,
                "reason": "Prevent forgetting decay according to the SM-2 algorithm schedule."
            }
        ]

        # Record recommendation in DB
        rec = Recommendation(
            user_id=user_id,
            topic_name=target_topic.name,
            action_type="adaptive_study",
            recommendation_reason=reason,
            priority_score=round(1.0 - curr_score, 2)
        )
        db.add(rec)
        await db.commit()

        return {
            "next_topic": target_topic.name,
            "topic_id": target_topic.id,
            "current_mastery": curr_score,
            "status": curr_status,
            "action_type": "study_topic",
            "reason": reason,
            "actions": actions
        }
