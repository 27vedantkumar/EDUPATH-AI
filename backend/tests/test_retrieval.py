import asyncio
import pytest
from backend.app.database.connection import AsyncSessionLocal, init_db
from backend.app.models.entities import Course, KnowledgeUnit
from backend.app.retrieval.embeddings import EmbeddingService
from backend.app.retrieval.bm25 import BM25Retriever
from backend.app.retrieval.vector_store import VectorStore
from backend.app.retrieval.hybrid_retriever import HybridRetriever

@pytest.mark.asyncio
async def test_retrieval_and_bm25():
    # 1. Test embedding normalization
    v1 = await EmbeddingService.get_embedding("Operating Systems deadlock Coffman conditions")
    v2 = await EmbeddingService.get_embedding("Banker's Algorithm safe state")
    v3 = await EmbeddingService.get_embedding("completely unrelated cooking recipe with pasta")

    sim_related = EmbeddingService.cosine_similarity(v1, v2)
    sim_unrelated = EmbeddingService.cosine_similarity(v1, v3)
    assert sim_related >= 0.0
    assert sim_unrelated <= 0.8

    # 2. Test BM25
    docs = [
        {"id": "doc1", "content": "Dijkstra created the Banker's Algorithm to test for a safe state and prevent deadlocks."},
        {"id": "doc2", "content": "CPU scheduling algorithms include Round Robin and Shortest Job First."},
        {"id": "doc3", "content": "Virtual memory management uses paging to translate virtual addresses."}
    ]
    bm25 = BM25Retriever()
    bm25.fit(docs)
    hits = bm25.search("Banker's Algorithm safe state")
    assert len(hits) > 0
    assert hits[0]["id"] == "doc1"

    # 3. Test Hybrid Retrieval over Database
    await init_db()
    async with AsyncSessionLocal() as session:
        course = Course(code=f"RET_TEST_{asyncio.get_event_loop().time()}", title="Retrieval Test Course")
        session.add(course)
        await session.flush()

        ku1 = KnowledgeUnit(
            course_id=course.id,
            document_id="doc_test_1",
            content_type="text",
            topic_name="Deadlocks",
            concept_name="Banker's Algorithm",
            content="Banker's Algorithm is a deadlock avoidance algorithm testing for safe states in resource allocation.",
            source_type="pdf",
            source_file="OS_Textbook.pdf",
            source_location={"page": 42}
        )
        session.add(ku1)
        await session.commit()

        retrieval_res = await HybridRetriever.retrieve(
            db=session,
            course_id=course.id,
            query="How does Banker's Algorithm check for a safe state?",
            top_k=3
        )

        assert len(retrieval_res["results"]) > 0
        assert retrieval_res["results"][0]["concept"] == "Banker's Algorithm"
        assert retrieval_res["results"][0]["source"]["page"] == 42
        assert retrieval_res["is_grounded"] is True
        print("\nAll retrieval and hybrid search tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_retrieval_and_bm25())
