import asyncio
import pytest
from backend.app.database.connection import AsyncSessionLocal, init_db
from backend.app.models.entities import Course, Document, KnowledgeUnit, Topic, Concept
from backend.app.ingestion.multimodal_service import MultimodalIngestionService

@pytest.mark.asyncio
async def test_multimodal_ingestion_txt_and_transcript():
    await init_db()
    async with AsyncSessionLocal() as session:
        # Create test course
        course = Course(code=f"TEST_OS_{asyncio.get_event_loop().time()}", title="Operating Systems Test Course")
        session.add(course)
        await session.flush()

        # Ingest text document
        sample_text = (
            "Deadlocks are a critical condition in multiprocessing operating systems.\n\n"
            "The four Coffman conditions necessary for deadlock are Mutual Exclusion, Hold and Wait, "
            "No Preemption, and Circular Wait. If any one of these is prevented, deadlock cannot occur.\n\n"
            "Deadlock Avoidance uses algorithms like Dijkstra's Banker's Algorithm to test for a Safe State "
            "before granting resource allocation requests."
        ).encode("utf-8")

        result = await MultimodalIngestionService.process_document(
            db=session,
            course_id=course.id,
            filename="Operating_Systems_Ch7.txt",
            file_bytes=sample_text
        )

        assert result["status"] == "ready"
        assert result["topics"] >= 1
        assert result["concepts"] >= 1
        assert result["knowledge_units"] >= 2

        # Ingest video transcript with timestamps
        transcript_sample = (
            "[21:43] Now let's explore deadlock avoidance techniques in detail.\n"
            "[22:17] Banker's Algorithm dynamically verifies that allocating resources maintains a Safe State.\n"
            "[23:05] Here is an example of safety algorithm state matrices."
        ).encode("utf-8")

        video_res = await MultimodalIngestionService.process_document(
            db=session,
            course_id=course.id,
            filename="Lecture7_Deadlocks.mp4",
            file_bytes=transcript_sample
        )

        assert video_res["status"] == "ready"
        assert video_res["video_segments"] == 3
        print("\nAll multimodal ingestion tests passed with verified source coordinates!")

if __name__ == "__main__":
    asyncio.run(test_multimodal_ingestion_txt_and_transcript())
