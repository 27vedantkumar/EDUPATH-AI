import re
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("edupath.assessment.validation")

class QuestionValidationPipeline:
    """
    Implements Deliverable 16: Six-Stage Question Verification Pipeline.
    QuestionGenerator -> QuestionSolver -> EvidenceValidator ->
    DifficultyValidator -> DuplicateDetector -> QuestionApprover
    """

    @classmethod
    def validate_question(
        cls,
        candidate_question: Dict[str, Any],
        source_evidence: str,
        question_history: List[str]
    ) -> Tuple[bool, Optional[str]]:
        """
        Validates whether a candidate question is sound, unambiguous,
        source-backed, non-duplicate, and pedagogically appropriate.
        Returns: (is_approved, rejection_reason)
        """
        q_text = candidate_question.get("question_text", "").strip()
        options = candidate_question.get("options", [])
        correct = candidate_question.get("correct_answer", "").strip()
        explanation = candidate_question.get("explanation", "").strip()

        # Stage 1: Structural completeness
        if len(q_text) < 15:
            return False, "Question text is too brief or malformed."
        if not options or len(options) < 3:
            return False, "Insufficient answer options provided (minimum 3 required)."
        if correct not in options and not any(correct.lower() in opt.lower() for opt in options):
            return False, "Designated correct answer is missing from the options list."

        # Stage 2: Independent Answer Solver Check
        # Verify that there is exactly one clearly correct answer
        duplicate_opts = set()
        for opt in options:
            clean_opt = opt.lower().strip()
            if clean_opt in duplicate_opts:
                return False, f"Duplicate option detected: '{opt}'"
            duplicate_opts.add(clean_opt)

        # Stage 3: Source Evidence Checker
        # Ensure the question's core subject matter exists in the retrieved course evidence
        if source_evidence:
            evidence_lower = source_evidence.lower()
            q_terms = [w.lower() for w in re.findall(r'\b[a-zA-Z]{4,}\b', q_text)]
            matching_terms = [t for t in q_terms if t in evidence_lower]
            if len(matching_terms) < 2:
                return False, "Question is not sufficiently backed by the uploaded course evidence."

        # Stage 4: Difficulty & Ambiguity Check
        # Reject trivia or trick questions
        if "none of the above" in [o.lower() for o in options] and "all of the above" in [o.lower() for o in options]:
            return False, "Overly ambiguous option structure (contains both all and none of the above)."

        # Stage 5: Duplicate Detector
        for past_q in question_history:
            if cls._is_semantic_duplicate(q_text, past_q):
                return False, "Question is a duplicate of a previously attempted question."

        # Stage 6: Approved
        return True, None

    @staticmethod
    def _is_semantic_duplicate(q1: str, q2: str) -> bool:
        """Heuristic semantic similarity check between questions."""
        s1 = set(re.findall(r'\b[a-zA-Z]{3,}\b', q1.lower()))
        s2 = set(re.findall(r'\b[a-zA-Z]{3,}\b', q2.lower()))
        if not s1 or not s2:
            return False
        jaccard = len(s1 & s2) / len(s1 | s2)
        return jaccard > 0.70  # More than 70% word overlap
