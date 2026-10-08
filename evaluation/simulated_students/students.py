import random
from typing import Dict, Any, List

class SimulatedStudent:
    """Base simulated learner profile with distinct cognitive performance parameters."""

    def __init__(self, name: str, persona: str, accuracy_prob: float, base_confidence: float):
        self.name = name
        self.persona = persona
        self.accuracy_prob = accuracy_prob
        self.base_confidence = base_confidence
        self.history: List[Dict[str, Any]] = []

    def answer_question(self, question: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

class StrongStudent(SimulatedStudent):
    """High accuracy, high confidence, grasps formal definitions quickly."""

    def __init__(self, name: str = "Elena Rostova"):
        super().__init__(name=name, persona="Strong Learner", accuracy_prob=0.92, base_confidence=0.88)

    def answer_question(self, question: Dict[str, Any]) -> Dict[str, Any]:
        is_correct = random.random() < self.accuracy_prob
        correct_opt = question["correct_option"]
        all_opts = [opt["id"] for opt in question["options"]]
        distractors = [opt for opt in all_opts if opt != correct_opt]

        chosen = correct_opt if is_correct else random.choice(distractors)
        confidence = min(1.0, max(0.6, self.base_confidence + random.uniform(-0.1, 0.1)))

        result = {
            "student_name": self.name,
            "persona": self.persona,
            "question_id": question["id"],
            "selected_option": chosen,
            "is_correct": chosen == correct_opt,
            "confidence": round(confidence, 2),
            "triggered_misconception": None if chosen == correct_opt else question.get("misconception_distractors", {}).get(chosen)
        }
        self.history.append(result)
        return result

class AverageStudent(SimulatedStudent):
    """Moderate accuracy, moderate confidence, vulnerable to intuitive misconceptions."""

    def __init__(self, name: str = "Marcus Vance"):
        super().__init__(name=name, persona="Average Learner", accuracy_prob=0.68, base_confidence=0.62)

    def answer_question(self, question: Dict[str, Any]) -> Dict[str, Any]:
        is_correct = random.random() < self.accuracy_prob
        correct_opt = question["correct_option"]
        all_opts = [opt["id"] for opt in question["options"]]
        distractors = [opt for opt in all_opts if opt != correct_opt]

        # Average learners frequently pick the prominent distractor (e.g. Option A: Unsafe = Deadlock)
        chosen = correct_opt if is_correct else distractors[0]
        confidence = min(1.0, max(0.4, self.base_confidence + random.uniform(-0.15, 0.15)))

        result = {
            "student_name": self.name,
            "persona": self.persona,
            "question_id": question["id"],
            "selected_option": chosen,
            "is_correct": chosen == correct_opt,
            "confidence": round(confidence, 2),
            "triggered_misconception": None if chosen == correct_opt else question.get("misconception_distractors", {}).get(chosen)
        }
        self.history.append(result)
        return result

class StrugglingStudent(SimulatedStudent):
    """Low accuracy, low confidence, exhibits foundational prerequisite gaps."""

    def __init__(self, name: str = "Devon Patel"):
        super().__init__(name=name, persona="Struggling Learner", accuracy_prob=0.35, base_confidence=0.35)

    def answer_question(self, question: Dict[str, Any]) -> Dict[str, Any]:
        is_correct = random.random() < self.accuracy_prob
        correct_opt = question["correct_option"]
        all_opts = [opt["id"] for opt in question["options"]]
        distractors = [opt for opt in all_opts if opt != correct_opt]

        chosen = correct_opt if is_correct else random.choice(distractors)
        confidence = min(0.6, max(0.15, self.base_confidence + random.uniform(-0.15, 0.15)))

        result = {
            "student_name": self.name,
            "persona": self.persona,
            "question_id": question["id"],
            "selected_option": chosen,
            "is_correct": chosen == correct_opt,
            "confidence": round(confidence, 2),
            "triggered_misconception": None if chosen == correct_opt else question.get("misconception_distractors", {}).get(chosen)
        }
        self.history.append(result)
        return result
