import os
import json
import logging
from typing import List, Dict, Any, Optional

from backend.app.config.settings import settings
from backend.app.retrieval.embeddings import EmbeddingService

logger = logging.getLogger("edupath.retrieval.vector_store")

class VectorStore:
    """
    Lightweight, persistent vector storage with metadata filtering.
    """

    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = storage_dir or settings.VECTOR_STORE_PATH
        os.makedirs(self.storage_dir, exist_ok=True)
        # In-memory index: list of {id, course_id, vector, metadata}
        self.entries: List[Dict[str, Any]] = []

    def add_item(
        self,
        item_id: str,
        course_id: str,
        vector: List[float],
        content: str,
        metadata: Dict[str, Any]
    ):
        # Update if exists, otherwise append
        for entry in self.entries:
            if entry["id"] == item_id:
                entry["vector"] = vector
                entry["content"] = content
                entry["metadata"] = metadata
                return

        self.entries.append({
            "id": item_id,
            "course_id": course_id,
            "vector": vector,
            "content": content,
            "metadata": metadata
        })

    def search_vector(
        self,
        query_vector: List[float],
        course_id: Optional[str] = None,
        filter_metadata: Optional[Dict[str, Any]] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Executes cosine similarity search across indexed vectors with metadata filtering.
        """
        candidates = []
        for entry in self.entries:
            if course_id and entry["course_id"] != course_id:
                continue

            if filter_metadata:
                match = True
                for k, v in filter_metadata.items():
                    if entry["metadata"].get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            sim = EmbeddingService.cosine_similarity(query_vector, entry["vector"])
            candidates.append({
                "id": entry["id"],
                "score": round(sim, 4),
                "content": entry["content"],
                "metadata": entry["metadata"]
            })

        candidates.sort(key=lambda x: x["score"], reverse=True)
        return candidates[:top_k]

    def save_course_index(self, course_id: str):
        """Persists course vector index to disk."""
        path = os.path.join(self.storage_dir, f"course_{course_id}.json")
        course_entries = [e for e in self.entries if e["course_id"] == course_id]
        with open(path, "w", encoding="utf-8") as f:
            json.dump(course_entries, f)
        logger.info(f"Saved {len(course_entries)} vectors for course {course_id} to {path}")

    def load_course_index(self, course_id: str):
        """Loads course vector index from disk if available."""
        path = os.path.join(self.storage_dir, f"course_{course_id}.json")
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    course_entries = json.load(f)
                # Filter out existing before adding
                self.entries = [e for e in self.entries if e["course_id"] != course_id]
                self.entries.extend(course_entries)
                logger.info(f"Loaded {len(course_entries)} vectors for course {course_id}")
            except Exception as e:
                logger.error(f"Error loading vector index for course {course_id}: {e}")

global_vector_store = VectorStore()
