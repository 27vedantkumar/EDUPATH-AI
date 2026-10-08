import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import (
    Course, Topic, Concept, Prerequisite, KnowledgeRelation,
    ConceptMastery, KnowledgeUnit
)

logger = logging.getLogger("edupath.services.knowledge_graph")

class KnowledgeGraphService:
    """
    Builds the interactive Course Knowledge Graph with dynamic nodes and edges,
    incorporating live learner mastery states and prerequisite locks.
    """

    @classmethod
    async def get_course_knowledge_graph(
        cls,
        db: AsyncSession,
        course_id: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Fetch Topics
        t_res = await db.execute(
            select(Topic).filter(Topic.course_id == course_id).order_by(Topic.order_index)
        )
        topics: List[Topic] = t_res.scalars().all()

        # 2. Fetch Concepts
        c_res = await db.execute(
            select(Concept).join(Topic).filter(Topic.course_id == course_id)
        )
        concepts: List[Concept] = c_res.scalars().all()
        concept_dict = {c.id: c for c in concepts}

        # 3. Fetch Mastery for user if provided
        user_mastery_map: Dict[str, float] = {}
        if user_id:
            m_res = await db.execute(
                select(ConceptMastery).filter(ConceptMastery.user_id == user_id)
            )
            for cm in m_res.scalars().all():
                user_mastery_map[cm.concept_id] = cm.mastery_score

        # 4. Fetch Prerequisites
        pr_res = await db.execute(
            select(Prerequisite)
        )
        prerequisites: List[Prerequisite] = pr_res.scalars().all()

        # Build prerequisite requirements map: concept_id -> [prerequisite_concept_ids]
        prereq_map: Dict[str, List[str]] = {}
        for p in prerequisites:
            if p.concept_id in concept_dict and p.prerequisite_concept_id in concept_dict:
                prereq_map.setdefault(p.concept_id, []).append(p.prerequisite_concept_id)

        # 5. Build Graph Nodes
        nodes = []
        for c in concepts:
            mastery = user_mastery_map.get(c.id, 0.0)
            
            # Check if locked by prerequisite
            # A node is locked if any prerequisite has mastery < 0.50
            is_locked = False
            needed_prereqs = prereq_map.get(c.id, [])
            for pid in needed_prereqs:
                if user_mastery_map.get(pid, 0.0) < 0.50:
                    is_locked = True
                    break

            # Determine visual status
            if is_locked and mastery < 0.30:
                status = "locked"
            elif mastery >= 0.85:
                status = "mastered"
            elif mastery >= 0.70:
                status = "proficient"
            elif mastery >= 0.50:
                status = "developing"
            elif mastery >= 0.30:
                status = "weak"
            else:
                status = "novice"

            nodes.append({
                "id": c.id,
                "label": c.name,
                "topic_id": c.topic_id,
                "summary": c.summary,
                "mastery": round(mastery, 2),
                "status": status,
                "is_locked": is_locked,
                "prerequisites": [concept_dict[pid].name for pid in needed_prereqs if pid in concept_dict]
            })

        # 6. Build Graph Edges
        edges = []
        for p in prerequisites:
            if p.concept_id in concept_dict and p.prerequisite_concept_id in concept_dict:
                edges.append({
                    "id": f"edge_{p.prerequisite_concept_id}_{p.concept_id}",
                    "source": p.prerequisite_concept_id,
                    "target": p.concept_id,
                    "relation_type": "PREREQUISITE_OF",
                    "strength": p.strength
                })

        # Fetch additional relations
        rel_res = await db.execute(select(KnowledgeRelation))
        for rel in rel_res.scalars().all():
            if rel.source_concept_id in concept_dict and rel.target_concept_id in concept_dict:
                edges.append({
                    "id": f"edge_rel_{rel.id}",
                    "source": rel.source_concept_id,
                    "target": rel.target_concept_id,
                    "relation_type": rel.relation_type,
                    "strength": rel.weight
                })

        return {
            "course_id": course_id,
            "total_topics": len(topics),
            "total_concepts": len(concepts),
            "nodes": nodes,
            "edges": edges,
            "topics": [{"id": t.id, "name": t.name} for t in topics]
        }
