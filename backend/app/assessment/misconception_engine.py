import logging
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import Question, QuestionAttempt, Misconception, Concept, Prerequisite
from backend.app.learner.mastery_service import LearnerMasteryService

logger = logging.getLogger("edupath.assessment.misconception")

class MisconceptionEngine:
    """
    Implements the 'Why Was I Wrong?' diagnostic analysis and targeted remediation engine.
    Detects conceptual gaps, pinpoints prerequisite weaknesses, generates a 2-minute lesson,
    and supplies an adaptive follow-up verification question.
    """

    KNOWN_MISCONCEPTIONS = {
        "Banker's Algorithm": {
            "Preemptive Scheduling": {
                "misconception": "You confused Deadlock Prevention (static condition elimination) with Deadlock Avoidance (dynamic safety testing).",
                "prerequisite": "Deadlock Conditions",
                "lesson": "Deadlock avoidance does not eliminate Coffman conditions in advance. Instead, it dynamically intercepts resource requests at run time and uses Banker's Algorithm to check whether allocating resources leaves the system in a state where at least one safe sequence exists.",
                "example": "Suppose 3 processes claim 10 tape drives total. If allocating 1 more drive leaves only 1 drive free and no process can finish with 1 drive, the state is Unsafe. Banker's Algorithm forces the requesting process to wait.",
                "followup": {
                    "question_text": "If a system is currently in an Unsafe State, does that mean a deadlock has already occurred?",
                    "options": [
                        "Yes, an unsafe state is synonymous with an active deadlock.",
                        "No, an unsafe state means the system cannot prevent processes from deadlocking if worst-case claims occur.",
                        "No, unsafe states only occur during memory page faults.",
                        "Yes, the OS immediately halts the CPU in unsafe states."
                    ],
                    "correct_answer": "No, an unsafe state means the system cannot prevent processes from deadlocking if worst-case claims occur.",
                    "explanation": "An unsafe state is not a deadlock; it is merely a state that may lead to a deadlock if processes request their maximum claims."
                }
            }
        },
        "Deadlock Conditions": {
            "default": {
                "misconception": "You confused necessary conditions with deadlock recovery mechanisms.",
                "prerequisite": "Process Lifecycle",
                "lesson": "All four Coffman conditions (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait) must hold simultaneously for a deadlock to exist. If even one is broken, deadlock is impossible.",
                "example": "Spooling print requests eliminates Mutual Exclusion for physical printers by sharing disk queues.",
                "followup": {
                    "question_text": "Which condition is broken if the OS forcibly confiscates resources from a waiting process?",
                    "options": ["Mutual Exclusion", "No Preemption", "Hold and Wait", "Circular Wait"],
                    "correct_answer": "No Preemption",
                    "explanation": "Confiscating resources introduces preemption, invalidating the 'No Preemption' condition."
                }
            }
        },
        "Safe State": {
            "default": {
                "misconception": "You assumed that any state with idle resources is automatically safe.",
                "prerequisite": "Resource Allocation Graph",
                "lesson": "A state is safe only if there is a verified execution order (Safe Sequence) where every process can acquire its peak resource declaration and release everything back to the pool.",
                "example": "Having 2 free RAM frames is not safe if process P1 needs 4 frames and P2 needs 3 frames to finish.",
                "followup": {
                    "question_text": "What is the primary condition for a state sequence <P1, P2, ... Pn> to be safe?",
                    "options": [
                        "Each process can satisfy its maximum claims using available resources plus resources freed by previous processes.",
                        "All processes must request resources simultaneously.",
                        "No process ever requests more than 1 resource.",
                        "All processes must have identical execution times."
                    ],
                    "correct_answer": "Each process can satisfy its maximum claims using available resources plus resources freed by previous processes.",
                    "explanation": "This definition ensures that at least one process can finish and free its resources, cascading until all finish."
                }
            }
        }
    }

    @classmethod
    async def analyze_mistake(
        cls,
        db: AsyncSession,
        user_id: str,
        question_id: str,
        student_answer: str,
        time_taken_seconds: int = 30
    ) -> Dict[str, Any]:
        """
        Processes a wrong answer, records the attempt, creates a Misconception record,
        and provides source-grounded remediation.
        """
        question = await db.get(Question, question_id)
        if not question:
            raise ValueError(f"Question '{question_id}' not found.")

        is_correct = (student_answer.strip().lower() == question.correct_answer.strip().lower())

        # 1. Record Question Attempt
        attempt = QuestionAttempt(
            user_id=user_id,
            question_id=question_id,
            student_answer=student_answer,
            is_correct=is_correct,
            time_taken_seconds=time_taken_seconds
        )
        db.add(attempt)
        await db.flush()

        # 2. Update Learner Mastery
        mastery_result = await LearnerMasteryService.update_mastery(
            db=db,
            user_id=user_id,
            concept_id=question.concept_id,
            correctness=1.0 if is_correct else 0.0,
            difficulty=question.difficulty,
            time_taken_seconds=time_taken_seconds
        )

        if is_correct:
            return {
                "is_correct": True,
                "message": "Correct! Excellent understanding demonstrated.",
                "explanation": question.explanation,
                "mastery_update": mastery_result
            }

        # 3. Detect Misconception
        concept = await db.get(Concept, question.concept_id)
        concept_name = concept.name if concept else "Core Concept"
        
        c_bank = cls.KNOWN_MISCONCEPTIONS.get(concept_name, cls.KNOWN_MISCONCEPTIONS.get("Deadlock Conditions"))
        pattern = c_bank.get(student_answer, c_bank.get("default", list(c_bank.values())[0]))

        # Look up prerequisite gap
        prereq_gap = pattern.get("prerequisite", "Core Fundamentals")

        # 4. Persist Misconception
        misc_record = Misconception(
            attempt_id=attempt.id,
            concept_name=concept_name,
            detected_misconception=pattern["misconception"],
            prerequisite_gap=prereq_gap,
            remediation_lesson=pattern["lesson"],
            remediation_example=pattern["example"],
            followup_question_json=pattern.get("followup")
        )
        db.add(misc_record)
        await db.commit()

        return {
            "is_correct": False,
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
            "why_was_i_wrong": {
                "detected_misconception": pattern["misconception"],
                "prerequisite_gap": prereq_gap,
                "source_evidence": question.source_evidence,
                "source_citation": question.source_reference,
                "remediation_lesson": pattern["lesson"],
                "remediation_example": pattern["example"],
                "followup_question": pattern.get("followup")
            },
            "mastery_update": mastery_result
        }
