import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import AuditLog, QuestionAttempt, Misconception, Concept

logger = logging.getLogger("edupath.learner.timeline")

class LearningTimelineService:
    """
    Renders the chronological learner journey and mastery evolution timeline.
    """

    @classmethod
    async def get_user_timeline(
        cls,
        db: AsyncSession,
        user_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        # Fetch audit events
        res = await db.execute(
            select(AuditLog).filter(AuditLog.user_id == user_id).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        logs = res.scalars().all()

        timeline = []
        for l in logs:
            event_type = l.action
            details = l.details or {}
            
            title = "Learning Activity"
            desc = "Activity recorded."
            badge_color = "blue"

            if event_type == "mastery_updated":
                delta = details.get("delta", 0.0)
                concept = details.get("concept_name", "Concept")
                new_score = int(details.get("new_score", 0.0) * 100)
                if delta > 0:
                    title = f"Mastery Gained: {concept} ({new_score}%)"
                    desc = f"Demonstrated understanding! Mastery increased by +{int(delta * 100)}% to {details.get('status')}."
                    badge_color = "emerald"
                else:
                    title = f"Review Recommended: {concept}"
                    desc = f"Struggle detected on {concept}. Remediation module generated."
                    badge_color = "amber"

            elif event_type == "diagnostic_completed":
                title = "Initial Diagnostic Assessment"
                desc = f"Baseline competency profile initialized across course topics."
                badge_color = "purple"

            elif event_type == "misconception_detected":
                title = f"Misconception Detected: {details.get('concept', '')}"
                desc = details.get("misconception", "Targeted remediation active.")
                badge_color = "rose"

            elif event_type == "flashcard_reviewed":
                title = f"Spaced Repetition Review: {details.get('topic', '')}"
                desc = f"SM-2 interval updated to {details.get('interval', 1)} days."
                badge_color = "indigo"

            timeline.append({
                "id": l.id,
                "timestamp": l.created_at.isoformat(),
                "action": event_type,
                "title": title,
                "description": desc,
                "badge_color": badge_color,
                "details": details
            })

        return timeline
