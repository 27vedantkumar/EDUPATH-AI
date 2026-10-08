import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import (
    User, LearnerProfile, Topic, Concept, TopicMastery,
    ConceptMastery, Prerequisite, Misconception, QuestionAttempt, AuditLog
)

logger = logging.getLogger("edupath.learner.mastery")

class LearnerMasteryService:
    """
    Centralized, explainable Bayesian-hybrid mastery tracking service.
    Implements single source of truth for all learning progress updates.
    """

    MASTERY_THRESHOLDS = [
        (0.85, "Mastered"),
        (0.70, "Proficient"),
        (0.50, "Developing"),
        (0.30, "Weak"),
        (0.00, "Novice")
    ]

    @classmethod
    def get_status_label(cls, score: float) -> str:
        for threshold, label in cls.MASTERY_THRESHOLDS:
            if score >= threshold:
                return label
        return "Novice"

    @classmethod
    async def update_mastery(
        cls,
        db: AsyncSession,
        user_id: str,
        concept_id: str,
        correctness: float,  # 1.0 = fully correct, 0.0 = incorrect
        difficulty: float = 0.5,  # 0.0 to 1.0
        confidence: float = 0.8,
        time_taken_seconds: int = 30
    ) -> Dict[str, Any]:
        """
        Unified mastery update algorithm:
        Delta = LearningRate * (Target - Current) * DifficultyFactor
        Updates ConceptMastery, TopicMastery, and Course/Profile OverallMastery.
        """
        # 1. Fetch Concept & Topic
        concept = await db.get(Concept, concept_id)
        if not concept:
            raise ValueError(f"Concept '{concept_id}' not found.")
        topic_id = concept.topic_id
        topic = await db.get(Topic, topic_id)

        # 2. Fetch or create ConceptMastery
        cm_res = await db.execute(
            select(ConceptMastery).filter(
                ConceptMastery.user_id == user_id,
                ConceptMastery.concept_id == concept_id
            )
        )
        cm = cm_res.scalars().first()
        if not cm:
            cm = ConceptMastery(
                user_id=user_id,
                concept_id=concept_id,
                mastery_score=0.20,
                status="Novice",
                attempts_count=0,
                correct_count=0
            )
            db.add(cm)
            await db.flush()

        old_concept_score = cm.mastery_score
        cm.attempts_count += 1
        if correctness >= 0.7:
            cm.correct_count += 1

        # Calculate new concept score
        learning_rate = 0.25 if cm.attempts_count <= 3 else 0.15
        diff_weight = 0.7 + (0.6 * difficulty)
        delta = learning_rate * (correctness - old_concept_score) * diff_weight
        new_concept_score = max(0.0, min(1.0, round(old_concept_score + delta, 3)))
        
        cm.mastery_score = new_concept_score
        cm.status = cls.get_status_label(new_concept_score)
        cm.confidence = round((cm.confidence * 0.7) + (confidence * 0.3), 2)
        cm.last_practiced_at = datetime.now(timezone.utc)

        # 3. Update Parent Topic Mastery
        tm_res = await db.execute(
            select(TopicMastery).filter(
                TopicMastery.user_id == user_id,
                TopicMastery.topic_id == topic_id
            )
        )
        tm = tm_res.scalars().first()
        if not tm:
            tm = TopicMastery(
                user_id=user_id,
                topic_id=topic_id,
                mastery_score=0.20,
                status="Novice",
                attempts_count=0,
                correct_count=0
            )
            db.add(tm)
            await db.flush()

        # Compute average mastery across all concepts under this topic
        all_cm_res = await db.execute(
            select(ConceptMastery).join(Concept).filter(
                ConceptMastery.user_id == user_id,
                Concept.topic_id == topic_id
            )
        )
        topic_concept_masteries = all_cm_res.scalars().all()
        if topic_concept_masteries:
            topic_avg = sum(c.mastery_score for c in topic_concept_masteries) / len(topic_concept_masteries)
            tm.mastery_score = round(topic_avg, 3)
            tm.status = cls.get_status_label(topic_avg)
        tm.attempts_count += 1
        if correctness >= 0.7:
            tm.correct_count += 1
        tm.recent_accuracy = round(tm.correct_count / max(1, tm.attempts_count), 2)
        tm.last_studied_at = datetime.now(timezone.utc)

        # 4. Update Overall LearnerProfile
        prof_res = await db.execute(
            select(LearnerProfile).filter(LearnerProfile.user_id == user_id)
        )
        profile = prof_res.scalars().first()
        if profile:
            # Recompute global average
            all_tm_res = await db.execute(
                select(TopicMastery).filter(TopicMastery.user_id == user_id)
            )
            all_topics = all_tm_res.scalars().all()
            if all_topics:
                profile.overall_mastery = round(sum(t.mastery_score for t in all_topics) / len(all_topics), 3)
            
            # Award XP: 10 XP for attempt + 25 XP if correct + 15 bonus if mastery increased
            xp_gained = 10 + (25 if correctness >= 0.7 else 0) + (15 if delta > 0.05 else 0)
            profile.xp_points += xp_gained
            profile.level = max(1, 1 + (profile.xp_points // 300))

        # 5. Log Timeline Event
        log = AuditLog(
            user_id=user_id,
            action="mastery_updated",
            details={
                "concept_id": concept_id,
                "concept_name": concept.name,
                "topic_name": topic.name if topic else "General",
                "old_score": old_concept_score,
                "new_score": new_concept_score,
                "delta": round(delta, 3),
                "status": cm.status,
                "correctness": correctness
            }
        )
        db.add(log)
        await db.commit()

        return {
            "concept_id": concept_id,
            "concept_name": concept.name,
            "old_mastery": old_concept_score,
            "new_mastery": new_concept_score,
            "delta": round(delta, 3),
            "status": cm.status,
            "topic_mastery": tm.mastery_score,
            "topic_status": tm.status,
            "overall_mastery": profile.overall_mastery if profile else new_concept_score
        }

    @classmethod
    async def get_why_am_i_weak_analysis(
        cls,
        db: AsyncSession,
        user_id: str,
        topic_id: str
    ) -> Dict[str, Any]:
        """
        Implements Section 27 'Why Am I Weak?' diagnostic dashboard breakdown.
        """
        topic = await db.get(Topic, topic_id)
        if not topic:
            raise ValueError(f"Topic '{topic_id}' not found.")

        tm_res = await db.execute(
            select(TopicMastery).filter(TopicMastery.user_id == user_id, TopicMastery.topic_id == topic_id)
        )
        tm = tm_res.scalars().first()

        # Fetch concepts under topic
        c_res = await db.execute(select(Concept).filter(Concept.topic_id == topic_id))
        concepts = c_res.scalars().all()
        concept_ids = [c.id for c in concepts]

        # Fetch misconceptions
        misc_res = await db.execute(
            select(Misconception).join(QuestionAttempt).filter(
                QuestionAttempt.user_id == user_id,
                Misconception.is_resolved == False
            )
        )
        active_misconceptions = misc_res.scalars().all()
        relevant_misconceptions = [m for m in active_misconceptions if any(c.name in m.concept_name for c in concepts)]

        # Fetch prerequisite weaknesses
        prereq_weaknesses = []
        for c in concepts:
            p_res = await db.execute(select(Prerequisite).filter(Prerequisite.concept_id == c.id))
            for pr in p_res.scalars().all():
                p_concept = await db.get(Concept, pr.prerequisite_concept_id)
                if p_concept:
                    # check p_concept mastery
                    pcm_res = await db.execute(
                        select(ConceptMastery).filter(ConceptMastery.user_id == user_id, ConceptMastery.concept_id == p_concept.id)
                    )
                    pcm = pcm_res.scalars().first()
                    score = pcm.mastery_score if pcm else 0.2
                    if score < 0.50:
                        prereq_weaknesses.append({
                            "prerequisite_concept": p_concept.name,
                            "for_concept": c.name,
                            "mastery": score,
                            "status": "Weak" if score < 0.3 else "Developing"
                        })

        accuracy = tm.recent_accuracy if tm else 0.0
        attempts = tm.attempts_count if tm else 0

        # Construct actionable recommendations
        action_plan = []
        if prereq_weaknesses:
            action_plan.append(f"Review fundamental prerequisite: '{prereq_weaknesses[0]['prerequisite_concept']}'")
        if relevant_misconceptions:
            action_plan.append(f"Clear active misconception: {relevant_misconceptions[0].detected_misconception}")
        action_plan.append(f"Read textbook source chapter on {topic.name}")
        action_plan.append("Complete 3 adaptive practice questions")

        return {
            "topic_id": topic_id,
            "topic_name": topic.name,
            "mastery_score": tm.mastery_score if tm else 0.0,
            "status": tm.status if tm else "Novice",
            "accuracy": f"{int(accuracy * 100)}%",
            "attempts": attempts,
            "common_misconceptions": [m.detected_misconception for m in relevant_misconceptions[:3]],
            "prerequisite_gaps": prereq_weaknesses[:3],
            "recommended_actions": action_plan
        }

MasteryService = LearnerMasteryService

