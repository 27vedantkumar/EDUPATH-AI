import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import Course, Question, QuestionAttempt, Concept, Topic
from backend.app.assessment.question_generator import AdaptiveQuestionGenerator
from backend.app.learner.mastery_service import LearnerMasteryService

logger = logging.getLogger("edupath.services.exam_simulator")

class ExamSimulatorService:
    """
    Implements Deliverables 25 & 100: Exam Simulator.
    Simulates authentic exam conditions: timed sessions, mixed topic coverage,
    no immediate hints, topic-wise score breakdown, and predicted exam readiness.
    """

    @classmethod
    async def create_exam(
        cls,
        db: AsyncSession,
        course_id: str,
        duration_minutes: int = 15,
        question_count: int = 6
    ) -> Dict[str, Any]:
        """Generates a timed mock examination."""
        questions = await AdaptiveQuestionGenerator.generate_questions_for_course(
            db=db,
            course_id=course_id,
            count=question_count
        )

        # Strip explanations and answers so student cannot see them during exam
        clean_questions = []
        for q in questions:
            clean_questions.append({
                "question_id": q["question_id"],
                "topic_name": q["topic_name"],
                "concept_name": q["concept_name"],
                "question_text": q["question_text"],
                "options": q["options"],
                "difficulty": q["difficulty"]
            })

        return {
            "exam_id": f"exam_{course_id[:8]}",
            "course_id": course_id,
            "title": "Comprehensive Midterm Simulation",
            "duration_minutes": duration_minutes,
            "total_questions": len(clean_questions),
            "questions": clean_questions
        }

    @classmethod
    async def submit_exam(
        cls,
        db: AsyncSession,
        user_id: str,
        course_id: str,
        answers: List[Dict[str, Any]]  # [{"question_id": "...", "answer": "..."}]
    ) -> Dict[str, Any]:
        """Evaluates exam answers, returns topic breakdown and readiness score."""
        total = len(answers)
        correct = 0
        topic_breakdown: Dict[str, Dict[str, int]] = {}
        question_reviews = []

        for item in answers:
            qid = item["question_id"]
            user_ans = item.get("answer", "")
            
            q = await db.get(Question, qid)
            if not q:
                continue

            concept = await db.get(Concept, q.concept_id)
            topic = await db.get(Topic, concept.topic_id) if concept else None
            t_name = topic.name if topic else "General"

            if t_name not in topic_breakdown:
                topic_breakdown[t_name] = {"total": 0, "correct": 0}
            topic_breakdown[t_name]["total"] += 1

            is_correct = (user_ans.strip().lower() == q.correct_answer.strip().lower())
            if is_correct:
                correct += 1
                topic_breakdown[t_name]["correct"] += 1

            # Update learner mastery
            await LearnerMasteryService.update_mastery(
                db=db,
                user_id=user_id,
                concept_id=q.concept_id,
                correctness=1.0 if is_correct else 0.0,
                difficulty=q.difficulty
            )

            question_reviews.append({
                "question_id": q.id,
                "question_text": q.question_text,
                "your_answer": user_ans,
                "correct_answer": q.correct_answer,
                "is_correct": is_correct,
                "explanation": q.explanation,
                "source": q.source_reference
            })

        overall_ratio = correct / max(1, total)
        readiness_pct = int(min(98, max(25, overall_ratio * 100)))

        # Compile topic scores
        topic_scores = [
            {
                "topic": t,
                "score": f"{data['correct']}/{data['total']}",
                "percentage": int((data['correct'] / data['total']) * 100)
            }
            for t, data in topic_breakdown.items()
        ]

        weak_areas = [t["topic"] for t in topic_scores if t["percentage"] < 60]

        return {
            "score": f"{correct}/{total}",
            "percentage": f"{int(overall_ratio * 100)}%",
            "predicted_readiness": f"{readiness_pct}%",
            "topic_scores": topic_scores,
            "weak_areas": weak_areas,
            "reviews": question_reviews,
            "message": "Exam submitted and graded! Detailed source-backed explanations provided below."
        }
