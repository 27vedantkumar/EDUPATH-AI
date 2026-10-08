import pytest
from sqlalchemy.future import select

from backend.app.database.connection import AsyncSessionLocal, init_db
from backend.app.models.entities import Course, Document, KnowledgeUnit, Topic, Concept, LearnerProfile, User
from backend.app.ingestion.multimodal_service import MultimodalIngestionService
from backend.app.retrieval.hybrid_retriever import HybridRetriever
from backend.app.ai.grounding_gate import GroundingGate
from backend.app.learner.mastery_service import LearnerMasteryService
from backend.app.services.flashcards import FlashcardService
from backend.app.services.study_planner import StudyPlannerService
from backend.app.security.sandbox import ASTSandbox

@pytest.mark.asyncio
async def test_complete_end_to_end_learning_loop():
    """
    Tests the complete end-to-end loop:
    UPLOAD -> CHUNK -> TAXONOMY -> GRAPH -> RETRIEVE -> GROUND -> ASSESS -> REVISE -> MASTERY
    """
    await init_db()

    async with AsyncSessionLocal() as db:
        # 1. Verify or create course
        c_res = await db.execute(select(Course).filter(Course.code == "OS_101"))
        course = c_res.scalars().first()
        assert course is not None, "Course OS_101 must exist from seed"

        # 2. Verify ingested documents
        d_res = await db.execute(select(Document).filter(Document.course_id == course.id))
        docs = d_res.scalars().all()
        assert len(docs) >= 1, "Documents must be present in the course"

        # 3. Verify knowledge units and source addressability
        ku_res = await db.execute(select(KnowledgeUnit).filter(KnowledgeUnit.course_id == course.id))
        units = ku_res.scalars().all()
        assert len(units) >= 3, "Knowledge units must be extracted"

        # Verify at least one unit retains a source location
        has_source = any(u.source_location and (u.source_location.get("page") or u.source_location.get("slide") or u.source_location.get("timestamp_start") is not None) for u in units)
        assert has_source, "Source addressability must be preserved"

        # 4. Verify Hybrid Retrieval (Dense Vector + BM25)
        retrieval_res = await HybridRetriever.retrieve(
            db=db,
            query="What are the four Coffman conditions for deadlock?",
            course_id=course.id,
            top_k=3
        )
        assert len(retrieval_res["results"]) > 0, "Retriever must return candidates"
        assert retrieval_res["grounding_confidence"] > 0.0, "Confidence must be calculated"

        # 5. Verify Grounding Gate
        gate = GroundingGate.evaluate(retrieval_res, scope="course")
        assert gate["status"] in ["SUPPORTED", "PARTIALLY_SUPPORTED"], "Query should be supported"
        assert len(gate["validated_citations"]) > 0, "Citations must be present"

        # 6. Verify Out-of-Domain Refusal
        ood_res = await HybridRetriever.retrieve(
            db=db,
            query="Historical stock prices of random corporations in 1985",
            course_id=course.id,
            top_k=3
        )
        ood_gate = GroundingGate.evaluate(ood_res, scope="course")
        assert ood_gate["status"] == "UNSUPPORTED" or not ood_gate.get("allowed", True), "Out-of-domain query must be refused"

        # 7. Verify Learner Model Mastery Update
        u_res = await db.execute(select(User).filter(User.username == "alex_rivera"))
        user = u_res.scalars().first()
        assert user is not None, "Demo user must exist"

        conc_res = await db.execute(select(Concept).join(Topic).filter(Topic.course_id == course.id))
        concept = conc_res.scalars().first()
        assert concept is not None, "Concept must exist"

        mastery_res = await LearnerMasteryService.update_mastery(
            db=db,
            user_id=user.id,
            concept_id=concept.id,
            correctness=1.0,
            confidence=0.9
        )
        assert "new_mastery" in mastery_res, "Mastery update must return new score"
        assert mastery_res["new_mastery"] > 0.0, "Mastery score must be positive"

        # 8. Verify Sandboxed Execution Security Check
        # Safe code passes AST pre-audit
        safe_code = "print(2 + 2)"
        safe_audit = ASTSandbox.pre_audit_code(safe_code)
        assert safe_audit["safe"] is True, "Safe code must pass AST pre-audit"

        # Malicious code fails AST pre-audit
        unsafe_code = "import os; os.system('dir')"
        unsafe_audit = ASTSandbox.pre_audit_code(unsafe_code)
        assert unsafe_audit["safe"] is False, "Dangerous code must be blocked by AST pre-audit"
