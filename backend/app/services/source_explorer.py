import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import (
    Course, Document, Topic, Concept, KnowledgeUnit,
    ConceptMastery, QuestionAttempt, Misconception, Prerequisite
)

logger = logging.getLogger("edupath.services.source_explorer")

class SourceExplorerService:
    """
    Powers the Source Explorer interface, enabling multi-level drill-down
    from Course down to atomic pages, slides, video clips, and concept masteries.
    """

    @classmethod
    async def get_course_explorer_tree(
        cls,
        db: AsyncSession,
        course_id: str
    ) -> Dict[str, Any]:
        """Returns the hierarchical content tree of the course."""
        # 1. Documents
        doc_res = await db.execute(
            select(Document).filter(Document.course_id == course_id)
        )
        documents = doc_res.scalars().all()

        # 2. Topics with Concepts
        top_res = await db.execute(
            select(Topic).filter(Topic.course_id == course_id).order_by(Topic.order_index)
        )
        topics = top_res.scalars().all()

        modules_tree = []
        for t in topics:
            c_res = await db.execute(
                select(Concept).filter(Concept.topic_id == t.id)
            )
            concepts = c_res.scalars().all()
            modules_tree.append({
                "topic_id": t.id,
                "name": t.name,
                "description": t.description,
                "concepts": [
                    {
                        "concept_id": c.id,
                        "name": c.name,
                        "summary": c.summary,
                        "difficulty_baseline": c.difficulty_baseline
                    }
                    for c in concepts
                ]
            })

        return {
            "course_id": course_id,
            "documents": [
                {
                    "id": d.id,
                    "filename": d.filename,
                    "file_type": d.file_type,
                    "file_size": d.file_size_bytes,
                    "status": d.status,
                    "created_at": d.created_at.isoformat()
                }
                for d in documents
            ],
            "modules": modules_tree
        }

    @classmethod
    async def get_concept_details(
        cls,
        db: AsyncSession,
        concept_id: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Returns deep concept details including source coordinates and mastery metrics."""
        c_res = await db.execute(select(Concept).filter(Concept.id == concept_id))
        concept = c_res.scalars().first()
        if not concept:
            raise ValueError(f"Concept '{concept_id}' not found.")

        # 1. Knowledge Units / Sources
        ku_res = await db.execute(
            select(KnowledgeUnit).filter(KnowledgeUnit.concept_id == concept_id)
        )
        units = ku_res.scalars().all()

        sources = []
        for u in units:
            sources.append({
                "knowledge_unit_id": u.id,
                "content_type": u.content_type,
                "source_type": u.source_type,
                "source_file": u.source_file,
                "location": u.source_location,
                "excerpt": u.content[:300] + ("..." if len(u.content) > 300 else "")
            })

        # 2. Prerequisites
        pr_res = await db.execute(
            select(Prerequisite).filter(Prerequisite.concept_id == concept_id)
        )
        prereqs = []
        for pr in pr_res.scalars().all():
            pr_concept = await db.get(Concept, pr.prerequisite_concept_id)
            if pr_concept:
                prereqs.append({"id": pr_concept.id, "name": pr_concept.name})

        # 3. Learner Mastery
        mastery_info = {"score": 0.0, "status": "Novice", "attempts": 0, "correct": 0}
        if user_id:
            m_res = await db.execute(
                select(ConceptMastery).filter(
                    ConceptMastery.concept_id == concept_id,
                    ConceptMastery.user_id == user_id
                )
            )
            cm = m_res.scalars().first()
            if cm:
                mastery_info = {
                    "score": cm.mastery_score,
                    "status": cm.status,
                    "attempts": cm.attempts_count,
                    "correct": cm.correct_count
                }

        return {
            "concept_id": concept.id,
            "name": concept.name,
            "summary": concept.summary,
            "topic_id": concept.topic_id,
            "sources": sources,
            "prerequisites": prereqs,
            "mastery": mastery_info
        }
