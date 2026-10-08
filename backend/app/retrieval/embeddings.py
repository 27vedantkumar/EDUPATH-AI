import math
import hashlib
import logging
from typing import List, Optional
import httpx

from backend.app.config.settings import settings

logger = logging.getLogger("edupath.retrieval.embeddings")

class EmbeddingService:
    """
    Generates normalized dense vector embeddings.
    Supports Google Gemini / OpenAI embeddings when API keys are configured,
    and provides a deterministic semantic hash-projection embedding for 100% offline autonomy.
    """

    DIMENSION = 128  # Compact normalized vector dimension for fast cosine indexing

    @classmethod
    async def get_embedding(cls, text: str) -> List[float]:
        """Generates a normalized float vector for the given text."""
        # Try Gemini if key is provided
        if settings.GEMINI_API_KEY:
            try:
                emb = await cls._get_gemini_embedding(text)
                if emb:
                    return emb
            except Exception as e:
                logger.warning(f"Gemini embedding API failed: {e}. Falling back to internal engine.")

        # Fallback to deterministic semantic projection
        return cls._generate_deterministic_embedding(text)

    @classmethod
    async def _get_gemini_embedding(cls, text: str) -> Optional[List[float]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "model": "models/text-embedding-004",
            "content": {"parts": [{"text": text[:2000]}]}
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                values = resp.json().get("embedding", {}).get("values", [])
                if values:
                    # Resize or normalize to standard dimension
                    return cls._normalize(values[:cls.DIMENSION])
        return None

    @classmethod
    def _generate_deterministic_embedding(cls, text: str) -> List[float]:
        """
        Generates a robust, reproducible pseudo-semantic vector representation
        using token n-gram feature hashing and term-frequency projection.
        """
        tokens = [t.lower().strip(".,;:?!()[]{}'\"") for t in text.split() if len(t) > 2]
        vec = [0.0] * cls.DIMENSION
        
        if not tokens:
            return vec

        for idx, token in enumerate(tokens):
            # Primary token hash
            h1 = int(hashlib.md5(token.encode('utf-8')).hexdigest()[:8], 16) % cls.DIMENSION
            # Secondary bigram hash if adjacent token exists
            weight = 1.0 + (0.5 if idx < 10 else 0.0)  # slightly emphasize initial tokens
            vec[h1] += weight
            
            if idx > 0:
                bigram = f"{tokens[idx-1]}_{token}"
                h2 = int(hashlib.sha256(bigram.encode('utf-8')).hexdigest()[:8], 16) % cls.DIMENSION
                vec[h2] += 1.5

        return cls._normalize(vec)

    @staticmethod
    def _normalize(vec: List[float]) -> List[float]:
        norm = math.sqrt(sum(x * x for x in vec))
        if norm < 1e-9:
            return [0.0] * len(vec)
        return [round(x / norm, 6) for x in vec]

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Calculates cosine similarity between two normalized vectors."""
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        return max(0.0, min(1.0, dot))
