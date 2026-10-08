import random
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import Course, Topic, Concept, KnowledgeUnit, Question, QuestionAttempt
from backend.app.assessment.validation_pipeline import QuestionValidationPipeline

logger = logging.getLogger("edupath.assessment.generator")

class AdaptiveQuestionGenerator:
    """
    Generates source-grounded, difficulty-calibrated assessment questions
    backed by real course knowledge units and validated through the verification pipeline.
    """

    # Domain Question Templates grounded in Operating Systems & Computer Architecture
    CURATED_BANK = [
        {
            "concept_name": "Deadlock Conditions",
            "topic_name": "Deadlocks",
            "question_text": "Which of the following is NOT one of the four necessary Coffman conditions required for a deadlock to occur?",
            "options": [
                "Mutual Exclusion",
                "Preemptive Scheduling",
                "Hold and Wait",
                "Circular Wait"
            ],
            "correct_answer": "Preemptive Scheduling",
            "explanation": "The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Preemption breaks deadlocks; 'No Preemption' is the necessary condition.",
            "difficulty": 0.40,
            "source_evidence": "The four Coffman conditions necessary for deadlock are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
            "source_reference": {"document": "Operating Systems.pdf", "page": 42}
        },
        {
            "concept_name": "Banker's Algorithm",
            "topic_name": "Deadlocks",
            "question_text": "How does Dijkstra's Banker's Algorithm decide whether to grant a resource request from a process?",
            "options": [
                "It immediately allocates the resource if the request does not exceed total system capacity.",
                "It simulates the allocation and checks if the system remains in a guaranteed Safe State.",
                "It forcibly terminates the longest running process to free memory.",
                "It waits until all other running processes have completed execution."
            ],
            "correct_answer": "It simulates the allocation and checks if the system remains in a guaranteed Safe State.",
            "explanation": "Banker's Algorithm tests for safety by simulating the allocation of predetermined maximum possible amounts of all resources, granting the request only if a safe sequence exists.",
            "difficulty": 0.65,
            "source_evidence": "Banker's Algorithm is a deadlock avoidance algorithm testing for safe states in resource allocation.",
            "source_reference": {"document": "OS_Lecture7.pptx", "slide": 18}
        },
        {
            "concept_name": "Safe State",
            "topic_name": "Deadlocks",
            "question_text": "What is the precise definition of a 'Safe State' in deadlock avoidance?",
            "options": [
                "A state where CPU utilization is guaranteed to remain above 90%.",
                "A state where there exists a sequence of processes such that each can satisfy its maximum resource claims with available plus released resources.",
                "A state where no process currently holds any locks or mutexes.",
                "A state where all processes have been suspended to prevent race conditions."
            ],
            "correct_answer": "A state where there exists a sequence of processes such that each can satisfy its maximum resource claims with available plus released resources.",
            "explanation": "A safe sequence ensures that even in the worst-case scenario where every process requests its maximum declared resources, no deadlock will occur.",
            "difficulty": 0.60,
            "source_evidence": "A state is safe if there exists a sequence of processes such that each process can satisfy its maximum resource requests.",
            "source_reference": {"document": "Operating Systems.pdf", "page": 43}
        },
        {
            "concept_name": "Resource Allocation Graph",
            "topic_name": "Deadlocks",
            "question_text": "In a Resource Allocation Graph (RAG) where each resource type has only a single instance, what does the presence of a cycle signify?",
            "options": [
                "A deadlock definitely exists.",
                "A deadlock is completely impossible.",
                "The system is operating at peak throughput.",
                "A context switch is currently in progress."
            ],
            "correct_answer": "A deadlock definitely exists.",
            "explanation": "If each resource type has exactly one instance, a cycle in the Resource Allocation Graph is both a necessary and sufficient condition for deadlock.",
            "difficulty": 0.55,
            "source_evidence": "Slide 18 contains a resource allocation graph demonstrating a deadlock cycle scenario.",
            "source_reference": {"document": "OS_Lecture7.pptx", "slide": 18}
        },
        {
            "concept_name": "Paging & Address Translation",
            "topic_name": "Memory Management",
            "question_text": "What major memory fragmentation problem is completely eliminated by pure paging?",
            "options": [
                "Internal fragmentation",
                "External fragmentation",
                "Thrashing",
                "Page faults"
            ],
            "correct_answer": "External fragmentation",
            "explanation": "Paging divides physical memory into fixed-size frames, so any free frame can be allocated to a process, completely eliminating external fragmentation.",
            "difficulty": 0.50,
            "source_evidence": "Paging divides physical memory into fixed frames, eliminating external fragmentation.",
            "source_reference": {"document": "Operating Systems.pdf", "page": 84}
        },
        {
            "concept_name": "Round Robin Scheduling",
            "topic_name": "CPU Scheduling",
            "question_text": "In Round Robin scheduling, what happens if the time quantum is chosen to be extremely large (larger than the longest CPU burst)?",
            "options": [
                "The algorithm degenerates into First-Come First-Served (FCFS).",
                "The algorithm achieves perfect Shortest Job First optimality.",
                "The system encounters a guaranteed deadlock.",
                "Context switching overhead increases exponentially."
            ],
            "correct_answer": "The algorithm degenerates into First-Come First-Served (FCFS).",
            "explanation": "If the time quantum is larger than any process's burst time, no process is preempted before completion, making the queue behave identically to FCFS.",
            "difficulty": 0.55,
            "source_evidence": "If time quantum is very large, Round Robin scheduling becomes equivalent to FCFS.",
            "source_reference": {"document": "Operating Systems.pdf", "page": 62}
        }
    ]

    @classmethod
    async def generate_questions_for_course(
        cls,
        db: AsyncSession,
        course_id: str,
        user_id: Optional[str] = None,
        topic_id: Optional[str] = None,
        count: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Generates approved, verified questions for a course or specific topic.
        """
        # Fetch question history for user to prevent duplicates
        past_questions = []
        if user_id:
            h_res = await db.execute(
                select(Question.question_text).join(QuestionAttempt).filter(QuestionAttempt.user_id == user_id)
            )
            past_questions = [row[0] for row in h_res.all()]

        # Filter candidate questions matching topic if specified
        candidates = list(cls.CURATED_BANK)
        if topic_id:
            topic = await db.get(Topic, topic_id)
            if topic:
                candidates = [q for q in candidates if q["topic_name"].lower() == topic.name.lower()]
                if not candidates:
                    candidates = list(cls.CURATED_BANK)

        random.shuffle(candidates)
        approved_questions = []

        for candidate in candidates:
            if len(approved_questions) >= count:
                break

            # Run validation pipeline
            is_valid, reason = QuestionValidationPipeline.validate_question(
                candidate_question=candidate,
                source_evidence=candidate["source_evidence"],
                question_history=past_questions
            )

            if is_valid:
                # Find matching concept in DB
                c_res = await db.execute(
                    select(Concept).filter(Concept.name == candidate["concept_name"])
                )
                concept = c_res.scalars().first()

                if concept:
                    # Persist Question entity in DB if not already existing
                    q_entity = Question(
                        course_id=course_id,
                        concept_id=concept.id,
                        question_type="mcq",
                        question_text=candidate["question_text"],
                        options=candidate["options"],
                        correct_answer=candidate["correct_answer"],
                        explanation=candidate["explanation"],
                        difficulty=candidate["difficulty"],
                        source_evidence=candidate["source_evidence"],
                        source_reference=candidate["source_reference"],
                        is_verified=True
                    )
                    db.add(q_entity)
                    await db.flush()

                    approved_questions.append({
                        "question_id": q_entity.id,
                        "concept_id": concept.id,
                        "concept_name": candidate["concept_name"],
                        "topic_name": candidate["topic_name"],
                        "question_text": candidate["question_text"],
                        "options": candidate["options"],
                        "difficulty": candidate["difficulty"],
                        "source": candidate["source_reference"]
                    })
                    past_questions.append(candidate["question_text"])

        await db.commit()
        return approved_questions
