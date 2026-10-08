import logging
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
        if not results or confidence < 0.25:
            return {
                "status": "UNSUPPORTED",
                "confidence": confidence,
                "allowed": False if scope == "course" else True,
                "refusal_message": "I couldn't find sufficient evidence for this question in your uploaded course material.",
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
                "document": sfile,
                "location_label": loc_label,
                "location_data": src,
                "excerpt": u.get("content", "")[:250].strip() + "...",
                "relevance": u.get("score", 0.90)
            })

        return citations
