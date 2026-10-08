import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.future import select

from backend.app.database.connection import init_db, AsyncSessionLocal
from backend.app.models.entities import (
    Course, User, LearnerProfile, Document, Topic, Concept,
    TopicMastery, ConceptMastery, Flashcard, StudyPlan, StudyPlanItem,
    Question, QuestionAttempt, Misconception
)
from backend.app.ingestion.multimodal_service import MultimodalIngestionService
from backend.app.security.auth import AuthService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

SAMPLE_PDF_CONTENT = """
CHAPTER 7: DEADLOCKS AND CONCURRENCY
Operating Systems Concepts & Principles

7.1 The Deadlock Problem
In a multiprogramming environment, several processes may compete for a finite number of resources.
A process requests resources; if the resources are not available at that time, the process enters a waiting state.
Sometimes, a waiting process is never again able to change state, because the resources it has requested are held by other waiting processes.
This situation is called a deadlock.

7.2 Deadlock Characterization
Four conditions must hold simultaneously in a system for a deadlock to arise (Coffman et al., 1971):
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. No Preemption: Resources cannot be preempted; that is, a resource can be released only voluntarily by the process holding it, after that process has completed its task.
4. Circular Wait: A closed chain of processes P0, P1, ..., Pn exists such that P0 is waiting for a resource held by P1, P1 is waiting for P2, and Pn is waiting for P0.

7.3 Deadlock Avoidance
Deadlock avoidance requires that the operating system be given in advance additional information concerning which resources a process will request and use during its lifetime.
With this knowledge of the complete sequence of requests and releases for each process, the system can decide for each request whether or not the process should wait.
To decide whether the current request can be satisfied or must be delayed, the system must consider the resources currently available, the resources currently allocated to each process, and the future requests and releases of each process.

7.4 Safe State
A state is safe if the system can allocate resources to each process (up to its maximum) in some order and still avoid a deadlock.
More formally, a system is in a safe state only if there exists a safe sequence.
A sequence of processes <P1, P2, ..., Pn> is a safe sequence for the current allocation state if, for each Pi, the resource requests that Pi can still make can be satisfied by the currently available resources plus the resources held by all Pj with j < i.

7.5 Banker's Algorithm
The Banker's Algorithm is a classic deadlock avoidance algorithm developed by Edsger Dijkstra.
When a new process enters the system, it must declare the maximum number of instances of each resource type that it may need.
This number may not exceed the total number of resources in the system.
When a user requests a set of resources, the system must determine whether the allocation of these resources will leave the system in a safe state.
If it will, the resources are allocated; otherwise, the process must wait until some other process releases enough resources.
""".encode("utf-8")

SAMPLE_PPTX_CONTENT = """
Slide 1: Operating Systems Lecture 7 - Deadlocks & Resource Graphs
Slide 2: Necessary Conditions for Deadlock (Coffman Conditions)
Slide 3: Resource Allocation Graph Definition & Cycles
Slide 18: Resource Allocation Graph & Cycle Detection
[Presenter Notes]: Point out that in a single-instance resource system, any cycle in the Resource Allocation Graph strictly implies a deadlock!
[Visual Description]: Slide 18 contains a Resource Allocation Graph depicting processes P1, P2 and resources R1, R2 forming a directed cycle, demonstrating an active deadlock scenario.
""".encode("utf-8")

SAMPLE_VIDEO_TRANSCRIPT = """
[00:00] Welcome to Lecture 7 on Advanced Concurrency and Deadlocks.
[05:12] Let's begin by reviewing process synchronization and mutual exclusion locks.
[12:30] Recall the four Coffman conditions: Mutual exclusion, hold and wait, no preemption, and circular wait.
[21:43] Now we move into Deadlock Avoidance and the mathematics of Safe States.
[22:17] Notice how Dijkstra's Banker's Algorithm evaluates the Allocation, Max, and Available matrices before approving an allocation request.
[23:05] If the system finds at least one safe sequence, it transitions into the new state; otherwise, the process is safely placed on the waiting queue.
[28:40] Next time we will study memory paging and virtual address translation.
""".encode("utf-8")

async def seed_demo():
    logger.info("Initializing database...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # 1. Create or verify Demo User
        demo_user = await AuthService.get_or_create_demo_user(session)
        logger.info(f"Verified demo user: {demo_user.username} ({demo_user.id})")

        # 2. Create or verify Demo Course
        c_res = await session.execute(select(Course).filter(Course.code == "OS_101"))
        course = c_res.scalars().first()
        if not course:
            course = Course(
                code="OS_101",
                title="Operating Systems & Concurrency",
                description="Core computer systems course covering process management, deadlocks, CPU scheduling, and virtual memory.",
                domain="Computer Science",
                is_demo_course=True,
                status="READY"
            )
            session.add(course)
            await session.flush()
            logger.info("Created demo course: OS_101")

        # 3. Ingest Course Materials
        logger.info("Ingesting demo textbook PDF...")
        await MultimodalIngestionService.process_document(
            db=session,
            course_id=course.id,
            filename="Operating_Systems_Ch7_Deadlocks.pdf",
            file_bytes=SAMPLE_PDF_CONTENT
        )

        logger.info("Ingesting demo slides PPTX...")
        await MultimodalIngestionService.process_document(
            db=session,
            course_id=course.id,
            filename="Lecture7_Deadlock_Avoidance_Slides.pptx",
            file_bytes=SAMPLE_PPTX_CONTENT
        )

        logger.info("Ingesting demo lecture video MP4 transcript...")
        await MultimodalIngestionService.process_document(
            db=session,
            course_id=course.id,
            filename="Lecture7_Video_Recording.mp4",
            file_bytes=SAMPLE_VIDEO_TRANSCRIPT
        )

        # 4. Seed Spaced-Repetition Flashcards
        logger.info("Seeding SM-2 flashcards...")
        flashcards_data = [
            (
                "Deadlocks", "Coffman Conditions",
                "What four conditions must hold simultaneously for a deadlock to occur?",
                "1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait",
                {"document": "Operating Systems.pdf", "page": 42}
            ),
            (
                "Deadlocks", "Banker's Algorithm",
                "What is the core purpose of Dijkstra's Banker's Algorithm?",
                "To dynamically verify whether granting a resource request will leave the operating system in a guaranteed Safe State.",
                {"document": "OS_Lecture7.pptx", "slide": 18}
            ),
            (
                "Deadlocks", "Safe State",
                "Is an Unsafe State in an operating system identical to a Deadlock?",
                "No. An unsafe state is not necessarily deadlocked; rather, it is a state from which the OS cannot prevent processes from deadlocking if worst-case claims materialize.",
                {"document": "Operating Systems.pdf", "page": 43}
            )
        ]

        for topic, concept, front, back, src in flashcards_data:
            existing = await session.execute(
                select(Flashcard).filter(Flashcard.user_id == demo_user.id, Flashcard.front == front)
            )
            if not existing.scalars().first():
                fc = Flashcard(
                    user_id=demo_user.id,
                    course_id=course.id,
                    topic_name=topic,
                    concept_name=concept,
                    front=front,
                    back=back,
                    source_reference=src,
                    interval_days=1,
                    repetition=1,
                    ease_factor=2.5,
                    next_review_at=datetime.now(timezone.utc)
                )
                session.add(fc)

        # 5. Seed Initial Study Plan
        logger.info("Seeding initial adaptive study plan...")
        now = datetime.now(timezone.utc)
        plan_check = await session.execute(
            select(StudyPlan).filter(StudyPlan.user_id == demo_user.id, StudyPlan.course_id == course.id)
        )
        if not plan_check.scalars().first():
            plan = StudyPlan(
                user_id=demo_user.id,
                course_id=course.id,
                target_date=now + timedelta(days=14),
                total_planned_hours=18.0,
                completed_hours=4.5,
                is_active=True
            )
            session.add(plan)
            await session.flush()

            items = [
                ("Day 1 — Deadlock Fundamentals & Coffman Conditions", "Deadlocks", "study", 45, True),
                ("Day 2 — Resource Allocation Graphs & Cycles", "Deadlocks", "study", 45, True),
                ("Day 3 — Deadlock Prevention vs Avoidance", "Deadlocks", "study", 45, False),
                ("Day 4 — Banker's Algorithm & Safe Sequences", "Deadlocks", "practice", 45, False),
                ("Day 5 — CPU Scheduling (FCFS, SJF, Round Robin)", "CPU Scheduling", "study", 45, False),
                ("Day 13 — High-Yield Blitz Concept Revision", "Revision", "revision", 60, False),
                ("Day 14 — Full Exam Simulator & Readiness Check", "Exam", "exam_blitz", 60, False),
            ]
            for idx, (title, topic, atype, mins, done) in enumerate(items):
                item = StudyPlanItem(
                    study_plan_id=plan.id,
                    day_number=idx + 1,
                    scheduled_date=now + timedelta(days=idx),
                    topic_name=topic,
                    title=title,
                    description=f"Curriculum milestone for {topic}.",
                    action_type=atype,
                    estimated_minutes=mins,
                    is_completed=done
                )
                session.add(item)

        await session.commit()
        logger.info("Demo course seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_demo())
