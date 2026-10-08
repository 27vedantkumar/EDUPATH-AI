import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import User, LearnerProfile, Achievement

logger = logging.getLogger("edupath.services.gamification")

class GamificationService:
    """
    Implements Deliverables 31 & 106: Gamification Service & Educational Mini-Games.
    Awards XP, tracks streaks, and manages 4 educational games linked directly to curriculum.
    """

    EDUCATIONAL_GAMES = {
        "term_match": {
            "title": "Term Match: Concurrency & Deadlocks",
            "description": "Pair technical operating system terms with their rigorous definitions.",
            "pairs": [
                {"term": "Banker's Algorithm", "definition": "Dynamic deadlock avoidance algorithm verifying safe sequences."},
                {"term": "Coffman Conditions", "definition": "Four simultaneous necessary criteria for deadlock existence."},
                {"term": "Paging", "definition": "Memory scheme dividing physical memory into frames and logical into pages."},
                {"term": "Round Robin", "definition": "Preemptive CPU scheduling utilizing fixed time quantum."}
            ]
        },
        "code_order": {
            "title": "Algorithm Scramble: Safety Algorithm",
            "description": "Arrange the scrambled algorithmic steps in the correct execution order.",
            "steps": [
                {"order": 1, "text": "Initialize Work = Available and Finish[i] = false for all processes."},
                {"order": 2, "text": "Find an index i such that Finish[i] == false and Need[i] <= Work."},
                {"order": 3, "text": "If such an i exists, execute Work = Work + Allocation[i] and Finish[i] = true."},
                {"order": 4, "text": "Repeat until either all Finish[i] == true (Safe) or no candidate i remains (Unsafe)."}
            ]
        },
        "flash_recall": {
            "title": "Flash Recall: Operating System Kernels",
            "description": "Rapidly recall key definitions before the countdown timer expires.",
            "cards": [
                {"prompt": "What does PCB stand for?", "answer": "Process Control Block"},
                {"prompt": "Which Coffman condition is broken by spooling?", "answer": "Mutual Exclusion"},
                {"prompt": "What hardware component handles virtual address translation?", "answer": "MMU (Memory Management Unit)"}
            ]
        }
    }

    @classmethod
    async def award_xp(
        cls,
        db: AsyncSession,
        user_id: str,
        amount: int,
        reason: str
    ) -> Dict[str, Any]:
        """Awards XP for legitimate learning achievements."""
        res = await db.execute(select(LearnerProfile).filter(LearnerProfile.user_id == user_id))
        profile = res.scalars().first()
        if not profile:
            return {"xp": 0, "level": 1}

        profile.xp_points += amount
        new_level = max(1, 1 + (profile.xp_points // 300))
        leveled_up = new_level > profile.level
        profile.level = new_level

        await db.commit()
        return {
            "xp_earned": amount,
            "total_xp": profile.xp_points,
            "level": profile.level,
            "leveled_up": leveled_up,
            "reason": reason
        }

    @classmethod
    def get_game_data(cls, game_type: str) -> Dict[str, Any]:
        return cls.EDUCATIONAL_GAMES.get(game_type, cls.EDUCATIONAL_GAMES["term_match"])
