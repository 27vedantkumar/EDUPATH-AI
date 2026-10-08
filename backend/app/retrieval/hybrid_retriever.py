import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import KnowledgeUnit, Concept, Topic
from backend.app.retrieval.embeddings import EmbeddingService
from backend.app.retrieval.bm25 import BM25Retriever
from backend.app.retrieval.vector_store import global_vector_store

logger = logging.getLogger("edupath.retrieval.hybrid")

class HybridRetriever:
    """
    Unifies Dense Vector Search, Okapi BM25 Keyword Search, and Knowledge Graph Proximity
    via Reciprocal Rank Fusion (RRF) and relevance reranking.
    """

    @classmethod
    async def retrieve(
        cls,
        db: AsyncSession,
        course_id: str,
        query: str,
        top_k: int = 5,
        scope_document_id: Optional[str] = None,
        scope_location: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes hybrid retrieval:
        1. Fetch all candidate KnowledgeUnits for course
        2. Vector search via embeddings
        3. Lexical search via BM25
        4. Reciprocal Rank Fusion (RRF)
        5. Grounding evidence confidence calculation
        """
        # Fetch knowledge units from DB
        stmt = select(KnowledgeUnit).filter(KnowledgeUnit.course_id == course_id)
        if scope_document_id:
            stmt = stmt.filter(KnowledgeUnit.document_id == scope_document_id)
            
        res = await db.execute(stmt)
        units: List[KnowledgeUnit] = res.scalars().all()
        
        if not units:
            return {
                "results": [],
                "grounding_confidence": 0.0,
                "is_grounded": False
            }

        # Index into in-memory vector store & BM25 if not already present
        bm25_docs = []
        for u in units:
            bm25_docs.append({"id": u.id, "content": f"{u.topic_name} {u.concept_name}: {u.content}"})
            # Ensure in vector store
            vec = u.embedding_vector or await EmbeddingService.get_embedding(f"{u.topic_name} {u.concept_name}: {u.content}")
            global_vector_store.add_item(
                item_id=u.id,
                course_id=course_id,
                vector=vec,
                content=u.content,
                metadata={
                    "topic": u.topic_name,
                    "concept": u.concept_name,
                    "source": u.source_location,
                    "source_type": u.source_type,
                    "source_file": u.source_file,
                    "document_id": u.document_id
                }
            )

        # 1. Vector Search
        query_vec = await EmbeddingService.get_embedding(query)
        filter_meta = {"document_id": scope_document_id} if scope_document_id else None
        vector_hits = global_vector_store.search_vector(
            query_vector=query_vec,
            course_id=course_id,
            filter_metadata=filter_meta,
            top_k=top_k * 2
        )

        # 2. BM25 Keyword Search
        bm25 = BM25Retriever()
        bm25.fit(bm25_docs)
        bm25_hits = bm25.search(query, top_k=top_k * 2)

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[str, float] = {}
        RRF_K = 60.0

        for rank, hit in enumerate(vector_hits):
            doc_id = hit["id"]
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (RRF_K + rank + 1.0))

        for rank, hit in enumerate(bm25_hits):
            doc_id = hit["id"]
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (RRF_K + rank + 1.0))

        # Check scope boost if source-scoped query
        if scope_location:
            for u in units:
                loc = u.source_location
                # Check page / slide / timestamp match
                if any(loc.get(k) == scope_location.get(k) for k in ["page", "slide", "start_seconds"]):
                    rrf_scores[u.id] = rrf_scores.get(u.id, 0.0) + 0.05

        # Sort combined results
        sorted_doc_ids = sorted(rrf_scores.keys(), key=lambda d: rrf_scores[d], reverse=True)
        unit_dict = {u.id: u for u in units}

        results = []
        top_rrf = rrf_scores[sorted_doc_ids[0]] if sorted_doc_ids else 0.0

        for doc_id in sorted_doc_ids[:top_k]:
            u = unit_dict.get(doc_id)
            if not u:
                continue

            # Normalized score relative to top hit (0.0 to 1.0)
            norm_score = round(rrf_scores[doc_id] / top_rrf, 4) if top_rrf > 0 else 0.0
            
            results.append({
                "knowledge_unit_id": u.id,
                "content": u.content,
                "score": norm_score,
                "source": u.source_location,
                "source_type": u.source_type,
                "source_file": u.source_file,
                "topic": u.topic_name,
                "concept": u.concept_name,
                "content_type": u.content_type
            })

        # Calculate grounding confidence
        # Strongest candidate cosine similarity + term hit presence
        best_vector_sim = vector_hits[0]["score"] if vector_hits else 0.0
        best_bm25_score = bm25_hits[0]["score"] if bm25_hits else 0.0
        
        # If there is zero lexical overlap (no terms found in entire course),
        # the query is completely ungrounded in course material.
        if best_bm25_score <= 0.0:
            grounding_confidence = 0.0
        else:
            grounding_confidence = round(0.6 * best_vector_sim + 0.4 * best_bm25_score, 4)
        is_grounded = grounding_confidence >= 0.50

        return {
            "query": query,
            "results": results,
            "grounding_confidence": grounding_confidence,
            "is_grounded": is_grounded
        }
