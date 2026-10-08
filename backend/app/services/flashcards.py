import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import Course, Concept, Flashcard, FlashcardReview
from backend.app.learner.mastery_service import LearnerMasteryService

logger = logging.getLogger("edupath.services.flashcards")

class FlashcardService:
    """
    Implements Deliverables 23 & 98: SuperMemo SM-2 Spaced Repetition Flashcard Engine.
    Directly updates learner concept mastery upon card review.
    """

    @classmethod
    async def review_card(
        cls,
        db: AsyncSession,
        user_id: str,
        flashcard_id: str,
        quality: int,  # 0 to 5
        time_taken_ms: int = 5000
    ) -> Dict[str, Any]:
        """
        Executes the SuperMemo SM-2 algorithm for spaced repetition:
        Quality:
        5 - Perfect response
        4 - Correct response after hesitation
        3 - Correct response recalled with serious difficulty
        2 - Incorrect response; where the correct one seemed easy to recall
        1 - Incorrect response; the correct one remembered
        0 - Complete blackout
        """
        card = await db.get(Flashcard, flashcard_id)
        if not card:
            raise ValueError(f"Flashcard '{flashcard_id}' not found.")

        # Record review
        review = FlashcardReview(
            flashcard_id=card.id,
            user_id=user_id,
            rating=quality,
            time_taken_ms=time_taken_ms
        )
        db.add(review)

        # 1. Update Ease Factor (EF)
        new_ef = card.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        card.ease_factor = max(1.3, round(new_ef, 2))

        # 2. Update Repetitions and Interval
        if quality < 3:
            card.repetition = 0
            card.interval_days = 1
        else:
            if card.repetition == 0:
                card.interval_days = 1
            elif card.repetition == 1:
                card.interval_days = 6
            else:
                card.interval_days = max(1, int(card.interval_days * card.ease_factor))
            card.repetition += 1

        card.last_reviewed_at = datetime.now(timezone.utc)
        card.next_review_at = card.last_reviewed_at + timedelta(days=card.interval_days)

        # 3. Propagate mastery change to learner model
        mastery_score = 1.0 if quality >= 4 else (0.6 if quality == 3 else 0.1)
        # Find concept by name if exists
        c_res = await db.execute(select(Concept).filter(Concept.name == card.concept_name))
        concept = c_res.scalars().first()
        if concept:
            await LearnerMasteryService.update_mastery(
                db=db,
                user_id=user_id,
                concept_id=concept.id,
                correctness=mastery_score,
                difficulty=0.5
            )

        await db.commit()

        return {
            "flashcard_id": card.id,
            "quality": quality,
            "new_interval_days": card.interval_days,
            "repetition_count": card.repetition,
            "next_review": card.next_review_at.strftime("%Y-%m-%d"),
            "ease_factor": card.ease_factor
        }

    @classmethod
    async def get_due_flashcards(
        cls,
        db: AsyncSession,
        user_id: str,
        course_id: str,
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """Fetches flashcards due for review according to SM-2 schedule."""
        now = datetime.now(timezone.utc)
        res = await db.execute(
            select(Flashcard).filter(
                Flashcard.user_id == user_id,
                Flashcard.course_id == course_id,
                Flashcard.next_review_at <= now
            ).limit(limit)
        )
        due_cards = res.scalars().all()

        # If none due, fetch general cards
        if not due_cards:
            res_all = await db.execute(
                select(Flashcard).filter(
                    Flashcard.user_id == user_id,
                    Flashcard.course_id == course_id
                ).limit(limit)
            )
            due_cards = res_all.scalars().all()

        return [
            {
                "id": c.id,
                "topic": c.topic_name,
                "concept": c.concept_name,
                "front": c.front,
                "back": c.back,
                "interval_days": c.interval_days,
                "source": c.source_reference
            }
            for c in due_cards
        ]
