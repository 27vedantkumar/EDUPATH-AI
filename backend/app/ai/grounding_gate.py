import logging
import re
from typing import Dict, Any, List

logger = logging.getLogger("edupath.ai.grounding_gate")

class GroundingGate:
    """
    Evaluates retrieved evidence confidence BEFORE allowing generation.
    Enforces strict refusal for unsupported queries to prevent hallucination.
    """

    SUPPORTED_THRESHOLD = 0.50
    STRONG_THRESHOLD = 0.70

    @classmethod
    def evaluate(
        cls,
        retrieval_result: Dict[str, Any],
        scope: str = "course"  # "course" (strict) vs "open"
    ) -> Dict[str, Any]:
        """
        Returns grounding evaluation:
        - status: 'SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNSUPPORTED'
        - confidence: float
        - allowed: bool
        - refusal_message: Optional[str]
        - validated_citations: List[Dict]
        """
        results = retrieval_result.get("results", [])
        confidence = retrieval_result.get("grounding_confidence", 0.0)

        # Check if no matching evidence found in course
        if not results or confidence < 0.28:
            return {
                "status": "UNSUPPORTED",
                "confidence": confidence,
                "allowed": False if scope == "course" else True,
                "refusal_message": "I couldn't find sufficient evidence for this question in your uploaded course material.",
                "validated_citations": []
            }

        # Check for adversarial or out-of-domain terms absent from evidence
        query = retrieval_result.get("query", "")
        if query:
            clean_q = re.sub(r'[^\w\s]', ' ', query.lower())
            stop_words = {
                "what", "is", "the", "according", "to", "this", "textbook", "in", "of",
                "give", "me", "a", "using", "that", "was", "how", "why", "can", "for",
                "and", "does", "with", "from", "explain", "timestamp", "lecture", "cover",
                "examples", "chapter", "shown", "slide", "video", "notes", "presenter",
                "depict", "depicts", "tell", "describe", "discuss", "discussed", "show",
                "which", "these", "about", "between"
            }
            content_words = [w for w in clean_q.split() if len(w) > 3 and w not in stop_words]
            if content_words:
                all_evidence = " ".join([r.get("content", "").lower() for r in results])
                missing = [w for w in content_words if w not in all_evidence]
                if (len(missing) / len(content_words) >= 0.45 and len(missing) >= 3) or (len(missing) / len(content_words) >= 0.60):
                    return {
                        "status": "UNSUPPORTED",
                        "confidence": 0.0,
                        "allowed": False if scope == "course" else True,
                        "refusal_message": f"I couldn't find evidence in your uploaded course material regarding '{missing[0]}'.",
                        "validated_citations": []
                    }

        # Check if marginal evidence
        if confidence < cls.SUPPORTED_THRESHOLD:
            return {
                "status": "PARTIALLY_SUPPORTED",
                "confidence": confidence,
                "allowed": True,
                "refusal_message": None,
                "warning": "⚠️ Limited evidence found in course material.",
                "validated_citations": cls._build_citations(results[:2])
            }

        # Confirmed grounded support
        return {
            "status": "SUPPORTED",
            "confidence": confidence,
            "allowed": True,
            "refusal_message": None,
            "validated_citations": cls._build_citations(results[:3])
        }

    @staticmethod
    def _build_citations(knowledge_units: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        citations = []
        for u in knowledge_units:
            src = u.get("source", {})
            stype = u.get("source_type", "pdf")
            sfile = u.get("source_file", "Course Material")
            
            # Format location label
            if stype == "pdf":
                loc_label = f"Page {src.get('page', 1)}"
            elif stype == "pptx":
                loc_label = f"Slide {src.get('slide', 1)}"
            elif stype == "video":
                loc_label = src.get("timestamp_formatted", "00:00").split(" - ")[0]
            elif stype == "docx":
                loc_label = f"Section {src.get('section', 1)}"
            elif stype == "image":
                loc_label = f"Figure: {src.get('figure', 'diagram')}"
            else:
                loc_label = "Course Reference"

            citations.append({
                "knowledge_unit_id": u.get("knowledge_unit_id"),
                "source_type": stype,
                "source_file": sfile,
                "document": sfile,
                "location_label": loc_label,
                "location_data": src,
                "excerpt": u.get("content", "")[:250].strip() + "...",
                "relevance": u.get("score", 0.90)
            })

        return citations
