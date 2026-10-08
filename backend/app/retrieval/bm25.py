import math
import re
from typing import List, Dict, Any

class BM25Retriever:
    """
    Pure-Python Okapi BM25 implementation for lexical keyword search
    over course documents.
    """

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = 0
        self.avg_doc_len = 0.0
        self.doc_lens: List[int] = []
        self.doc_token_counts: List[Dict[str, int]] = []
        self.idf: Dict[str, float] = {}
        self.corpus_ids: List[str] = []

    def fit(self, documents: List[Dict[str, Any]]):
        """
        Indexes a list of documents. Each document must have 'id' and 'content'.
        """
        self.corpus_size = len(documents)
        if self.corpus_size == 0:
            return

        self.corpus_ids = []
        self.doc_lens = []
        self.doc_token_counts = []
        df: Dict[str, int] = {}

        total_tokens = 0
        for doc in documents:
            self.corpus_ids.append(doc["id"])
            tokens = self._tokenize(doc["content"])
            doc_len = len(tokens)
            self.doc_lens.append(doc_len)
            total_tokens += doc_len

            counts: Dict[str, int] = {}
            for t in tokens:
                counts[t] = counts.get(t, 0) + 1
            self.doc_token_counts.append(counts)

            for unique_t in counts.keys():
                df[unique_t] = df.get(unique_t, 0) + 1

        self.avg_doc_len = total_tokens / self.corpus_size

        # Compute IDF with smoothing
        self.idf = {}
        for term, freq in df.items():
            self.idf[term] = math.log(1.0 + (self.corpus_size - freq + 0.5) / (freq + 0.5))

    def search(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Returns scored results for query: [{'id': doc_id, 'score': bm25_score}]
        """
        if self.corpus_size == 0:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scores: List[float] = [0.0] * self.corpus_size

        for term in query_tokens:
            if term not in self.idf:
                continue
            idf_val = self.idf[term]

            for idx in range(self.corpus_size):
                tf = self.doc_token_counts[idx].get(term, 0)
                if tf == 0:
                    continue
                d_len = self.doc_lens[idx]
                numerator = tf * (self.k1 + 1.0)
                denominator = tf + self.k1 * (1.0 - self.b + self.b * (d_len / self.avg_doc_len))
                scores[idx] += idf_val * (numerator / denominator)

        # Normalize scores to 0.0 - 1.0
        max_score = max(scores) if scores else 0.0
        results = []
        for idx, score in enumerate(scores):
            if score > 0.0:
                norm_score = round(score / max_score, 4) if max_score > 0 else 0.0
                results.append({
                    "id": self.corpus_ids[idx],
                    "score": norm_score,
                    "raw_bm25": score
                })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    STOP_WORDS = {
        "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
        "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
        "to", "was", "were", "will", "with", "this", "or"
    }

    @classmethod
    def _tokenize(cls, text: str) -> List[str]:
        # Strip punctuation and keep alphanumeric words excluding common stop words
        clean = re.sub(r'[^\w\s]', ' ', text.lower())
        return [w for w in clean.split() if len(w) > 1 and w not in cls.STOP_WORDS]
