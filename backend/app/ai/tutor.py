import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import Course, Concept, Topic, Conversation, ConversationMessage, Citation
from backend.app.retrieval.hybrid_retriever import HybridRetriever
from backend.app.ai.grounding_gate import GroundingGate
from backend.app.ai.provider import ai_provider

logger = logging.getLogger("edupath.ai.tutor")

class GroundedTutorService:
    """
    Unified Grounded AI Tutor supporting 6 teaching modes, multilingual delivery,
    source-scoped queries, and strictly verified citations.
    """

    MODE_PROMPTS = {
        "beginner": (
            "You are a friendly, patient, and highly encouraging academic mentor. "
            "Explain concepts simply using intuitive everyday analogies. Avoid intimidating jargon, "
            "and focus on building deep conceptual clarity from first principles."
        ),
        "exam": (
            "You are an elite academic exam coach. Provide concise, high-yield answers structured "
            "with precise definitions, bullet points, core formulas, and exact technical terminology "
            "that professors and examiners award maximum marks for."
        ),
        "deep_dive": (
            "You are a Principal Computer Systems Architect. Dive deep into internal OS mechanics, "
            "memory layout, kernel structures, synchronization invariants, time/space complexity, and subtle edge cases."
        ),
        "interview": (
            "You are a Senior Technical Interviewer at a premier engineering company. Ask probing questions, "
            "challenge assumptions, evaluate architectural trade-offs, and assess efficiency."
        ),
        "socratic": (
            "You are a Socratic tutor. Do NOT give away the complete answer directly. "
            "Instead, guide the student through logical prompts, thought-provoking questions, and hints "
            "so that they discover the solution through their own reasoning."
        ),
        "bilingual": (
            "You are a bilingual (English + Hinglish) educational mentor. Explain the concept in clear English "
            "accompanied by intuitive, conversational Hinglish (Hindi written in Roman script) using relatable everyday analogies.\n"
            "Format:\n"
            "**English:** [Clear English explanation]\n"
            "**Hinglish:** [Engaging conversational Hinglish breakdown]"
        )
    }

    @classmethod
    async def ask(
        cls,
        db: AsyncSession,
        course_id: str,
        query: str,
        mode: str = "beginner",
        language: str = "en",
        scope: str = "course",  # "course" or "open"
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes grounded tutoring pipeline:
        Query -> Hybrid Retrieval -> Grounding Gate -> Mode Prompt -> AI Synthesis -> Citations
        """
        # 1. Retrieve course evidence
        retrieval = await HybridRetriever.retrieve(
            db=db,
            course_id=course_id,
            query=query,
            top_k=4
        )

        # 2. Evaluate Grounding Gate
        gate = GroundingGate.evaluate(retrieval, scope=scope)
        if not gate["allowed"]:
            return {
                "answer": gate["refusal_message"],
                "grounded": False,
                "confidence": gate["confidence"],
                "citations": [],
                "related_topics": [],
                "recommended_action": {
                    "action": "expand_scope_or_rephrase",
                    "suggestion": "Try rephrasing your question using terms covered in the course material."
                }
            }

        # 3. Construct System Prompt & Grounded Evidence
        mode_key = mode.lower() if mode.lower() in cls.MODE_PROMPTS else "beginner"
        system_prompt = cls.MODE_PROMPTS[mode_key]
        
        if language.lower() not in ["en", "english"]:
            system_prompt += f"\n\nIMPORTANT: Respond in the student's requested language ({language}), while preserving all technical terminology and citations."

        evidence_snippets = []
        for c in gate["validated_citations"]:
            evidence_snippets.append(f"[{c['document']} - {c['location_label']}]: {c['excerpt']}")
        evidence_block = "\n\n".join(evidence_snippets)

        prompt_payload = (
            f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\n"
            f"RETRIEVED COURSE EVIDENCE:\n{evidence_block}\n\n"
            f"USER QUESTION:\n{query}\n\n"
            f"INSTRUCTION: Answer using the provided course evidence as your source of truth. "
            f"Cite the relevant documents and page/slide/timestamps where appropriate."
        )

        # 4. Generate Grounded AI Response
        raw_answer = await ai_provider.generate_response(prompt_payload, system_prompt)

        # 5. Extract related topics and recommended next action
        related_topics = list({u.get("topic") for u in retrieval["results"] if u.get("topic")})
        primary_concept = retrieval["results"][0].get("concept") if retrieval["results"] else "Core Concept"
        
        rec_action = {
            "type": "practice_quiz",
            "concept": primary_concept,
            "label": f"Take 2-Minute Diagnostic on '{primary_concept}'",
            "reason": f"Reinforce your understanding of '{primary_concept}' based on cited lecture material."
        }

        # 6. Persist Conversation & Message if user_id or conversation_id provided
        if conversation_id:
            msg_user = ConversationMessage(
                conversation_id=conversation_id,
                sender="user",
                content=query,
                is_grounded=False
            )
            msg_bot = ConversationMessage(
                conversation_id=conversation_id,
                sender="assistant",
                content=raw_answer,
                is_grounded=True,
                grounding_confidence=gate["confidence"]
            )
            db.add(msg_user)
            db.add(msg_bot)
            await db.flush()

            # Add citations to DB
            for c in gate["validated_citations"]:
                if c.get("knowledge_unit_id"):
                    cit = Citation(
                        message_id=msg_bot.id,
                        knowledge_unit_id=c["knowledge_unit_id"],
                        source_type=c["source_type"],
                        document_title=c["document"],
                        location_label=c["location_label"],
                        location_data=c["location_data"],
                        excerpt=c["excerpt"],
                        relevance_score=c["relevance"]
                    )
                    db.add(cit)
            await db.commit()

        return {
            "answer": raw_answer,
            "grounded": True,
            "confidence": gate["confidence"],
            "citations": gate["validated_citations"],
            "related_topics": related_topics,
            "recommended_action": rec_action,
            "provider": ai_provider.get_active_provider_name()
        }

    @classmethod
    async def ask_source_question(
        cls,
        db: AsyncSession,
        course_id: str,
        document_id: str,
        location: Dict[str, Any],  # {"page": 42} or {"slide": 18} or {"start_seconds": 1303}
        query: str,
        mode: str = "beginner"
    ) -> Dict[str, Any]:
        """
        Implements Section 24 & Deliverable 28 'Ask About This' mode,
        strictly scoping retrieval to the selected page, slide, or video segment.
        """
        retrieval = await HybridRetriever.retrieve(
            db=db,
            course_id=course_id,
            query=query,
            top_k=3,
            scope_document_id=document_id,
            scope_location=location
        )

        gate = GroundingGate.evaluate(retrieval, scope="course")
        
        mode_key = mode.lower() if mode.lower() in cls.MODE_PROMPTS else "beginner"
        system_prompt = (
            f"{cls.MODE_PROMPTS[mode_key]}\n"
            f"You are explaining a specific source segment ({location}) in response to the student's question."
        )

        evidence_snippets = [f"[{c['document']} - {c['location_label']}]: {c['excerpt']}" for c in gate["validated_citations"]]
        evidence_block = "\n\n".join(evidence_snippets)

        prompt_payload = (
            f"SCOPED SOURCE EVIDENCE ({location}):\n{evidence_block}\n\n"
            f"STUDENT QUESTION ABOUT THIS SECTION:\n{query}"
        )

        raw_answer = await ai_provider.generate_response(prompt_payload, system_prompt)

        return {
            "answer": raw_answer,
            "grounded": True,
            "confidence": gate["confidence"],
            "scope": location,
            "citations": gate["validated_citations"]
        }
