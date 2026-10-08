import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import Course, Topic, Concept, LearnerProfile, TopicMastery, ConceptMastery, AuditLog
from backend.app.assessment.question_generator import AdaptiveQuestionGenerator
from backend.app.learner.mastery_service import LearnerMasteryService

logger = logging.getLogger("edupath.assessment.diagnostic")

class DiagnosticAssessmentEngine:
    """
    Implements Deliverables 14 & 89: Initial Diagnostic Assessment.
    Inspects course topics, generates representative benchmark questions,
    scores baseline competencies, and personalizes the initial learner roadmap.
    """

    @classmethod
    async def create_diagnostic(
        cls,
        db: AsyncSession,
        course_id: str
    ) -> Dict[str, Any]:
        """Generates a representative diagnostic test covering the major topics."""
        questions = await AdaptiveQuestionGenerator.generate_questions_for_course(
            db=db,
            course_id=course_id,
            count=5
        )
        return {
            "course_id": course_id,
            "title": "Comprehensive Course Diagnostic Assessment",
            "instructions": "Answer these foundational questions to calibrate your personalized learning roadmap.",
            "total_questions": len(questions),
            "questions": questions
        }

    @classmethod
    async def evaluate_diagnostic(
        cls,
        db: AsyncSession,
        user_id: str,
        course_id: str,
        submissions: List[Dict[str, Any]],  # [{"question_id": "...", "answer": "..."}]
        learning_goal: str = "Master Core Systems Concepts"
    ) -> Dict[str, Any]:
        """
        Evaluates diagnostic submissions, computes initial baseline mastery,
        and generates the student's initial competency vector.
        """
        total = len(submissions)
        correct_count = 0
        topic_scores: Dict[str, List[float]] = {}

        for item in submissions:
            qid = item["question_id"]
            ans = item.get("answer", "")
            
            # Fetch question
            from backend.app.models.entities import Question
            q = await db.get(Question, qid)
            if not q:
                continue

            is_correct = (ans.strip().lower() == q.correct_answer.strip().lower())
            if is_correct:
                correct_count += 1

            # Update concept mastery baseline
            await LearnerMasteryService.update_mastery(
                db=db,
                user_id=user_id,
                concept_id=q.concept_id,
                correctness=1.0 if is_correct else 0.2,
                difficulty=q.difficulty
            )

        baseline_ratio = correct_count / max(1, total)
        initial_overall = round(0.20 + (0.60 * baseline_ratio), 2)

        # Update LearnerProfile
        prof_res = await db.execute(select(LearnerProfile).filter(LearnerProfile.user_id == user_id))
        profile = prof_res.scalars().first()
        if profile:
            profile.overall_mastery = initial_overall
            profile.learning_goal = learning_goal
            profile.xp_points += 100  # Bonus XP for completing diagnostic

        # Log diagnostic completion
        log = AuditLog(
            user_id=user_id,
            action="diagnostic_completed",
            details={
                "course_id": course_id,
                "score": f"{correct_count}/{total}",
                "baseline_mastery": initial_overall,
                "goal": learning_goal
            }
        )
        db.add(log)
        await db.commit()

        return {
            "score": f"{correct_count}/{total}",
            "percentage": f"{int(baseline_ratio * 100)}%",
            "baseline_mastery": initial_overall,
            "status": LearnerMasteryService.get_status_label(initial_overall),
            "message": f"Diagnostic complete! Your personalized study roadmap has been initialized."
        }
