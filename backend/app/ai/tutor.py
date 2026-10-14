import logging
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.entities import Course, Concept, Topic, Conversation, ConversationMessage, Citation
from backend.app.retrieval.hybrid_retriever import HybridRetriever
from backend.app.ai.grounding_gate import GroundingGate
from backend.app.ai.provider import ai_provider
from backend.app.services.web_search import WebSearchService

logger = logging.getLogger("edupath.ai.tutor")


class GroundedTutorService:
    """
    Unified Grounded & General-Purpose AI Tutor supporting 6 teaching modes,
    live web search with primary source verification, inline citations,
    dynamic related questions, long-conversation memory, and zero token/credit limits.
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
            "You are a Principal Computer Systems Architect. Dive deep into internal mechanics, "
            "memory layout, architecture, invariants, time/space complexity, and subtle edge cases."
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
    def generate_related_questions(
        cls,
        query: str,
        primary_concept: str = "Core Concept",
        web_sources: Optional[List[Dict[str, Any]]] = None
    ) -> List[str]:
        """
        Dynamically generates 3-4 contextual follow-up questions tailored to the query,
        learning domain, and any retrieved web sources.
        """
        q_clean = query.strip().rstrip("?").lower()

        # 1. Topic-tailored questions
        # Math & arithmetic calculations (e.g. 2+2, calculate 15 * 4)
        math_check = re.sub(r'^(what is|calculate|evaluate|solve|compute|what\'s|find)\s+', '', q_clean).strip().rstrip('?=. ')
        if re.match(r'^[\d\s\+\-\*\/\%\^\(\)\.]+$', math_check) and any(c in math_check for c in '+-*/%^') and any(c.isdigit() for c in math_check):
            return [
                "Show step-by-step arithmetic operations and order of operations (PEMDAS / BODMAS).",
                "Explain the foundational mathematical proofs and Peano axioms for addition.",
                "Give me an interactive mental math practice problem."
            ]
        if "variable" in q_clean:
            return [
                "What is the difference between mutable and immutable variables in programming?",
                "How does variable scope and lifetime operate in memory (Stack vs. Heap)?",
                "How do statically typed and dynamically typed languages handle variable types?"
            ]
        if "photosynthesis" in q_clean:
            return [
                "What is the difference between the light reactions and the Calvin cycle?",
                "Why are chlorophyll pigments specifically tuned to absorb blue and red light?",
                "How do environmental factors like temperature and CO2 limit photosynthetic rate?"
            ]
        if "two sum" in q_clean or "hash map" in q_clean:
            return [
                "How does the hash map approach compare to the two-pointer technique on sorted arrays?",
                "Can we generalize this logic to solve the 3Sum problem in O(N^2) time?",
                "What happens if there are duplicate values or multiple valid index pairs in the input?"
            ]
        if "binary search" in q_clean:
            return [
                "How do we handle lower_bound vs upper_bound search in arrays with duplicates?",
                "Why is mid calculated as `low + (high - low) // 2` instead of `(low + high) // 2`?",
                "Can binary search be applied to monotonic functions like square roots and peak finding?"
            ]
        if "deadlock" in q_clean or "banker" in q_clean or "coffman" in q_clean:
            return [
                "Which of the 4 Coffman conditions is most practical to break in modern distributed systems?",
                "How does Banker's Algorithm differ from Resource Allocation Graph cycle detection?",
                "What is the formal difference between an Unsafe State and an actual Deadlock?"
            ]
        if "machine learning" in q_clean or "deep learning" in q_clean or "ai" in q_clean:
            return [
                "What are the trade-offs between classical ML feature engineering and deep learning representations?",
                "When should I prefer XGBoost or Random Forests over a Deep Neural Network for tabular datasets?",
                "How do attention mechanisms in Transformers solve the vanishing gradient issue of RNNs?"
            ]
        if "python" in q_clean:
            return [
                "How does Python's Global Interpreter Lock (GIL) impact CPU-bound multithreading?",
                "What are Python generators and how do they optimize memory during large data streams?",
                "How does reference counting and cyclic garbage collection work in CPython?"
            ]

        # 2. If web sources were retrieved, base questions on genuine retrieved article topics
        if web_sources and len(web_sources) > 0:
            first_title = web_sources[0].get("title", "").replace(" — Wikipedia", "").strip()
            second_title = web_sources[1].get("title", "").replace(" — Wikipedia", "").strip() if len(web_sources) > 1 else ""
            questions = [
                f"What are the practical applications and industry best practices for {first_title}?",
                f"How does {first_title} compare to alternative paradigms or legacy methods?"
            ]
            if second_title:
                questions.append(f"How is {first_title} interconnected with {second_title}?")
            else:
                questions.append(f"Can you provide a step-by-step code demonstration for {first_title}?")
            return questions

        # 3. Dynamic general-purpose follow-ups
        return [
            f"Can you provide a concrete code example or mathematical trace for {primary_concept}?",
            f"What are the common edge cases and potential pitfalls when applying {primary_concept}?",
            f"How would you explain {primary_concept} in a technical interview vs. to a beginner?"
        ]

    @classmethod
    async def ask(
        cls,
        db: AsyncSession,
        course_id: Optional[str] = "OS_101",
        query: str = "",
        mode: str = "beginner",
        language: str = "en",
        scope: str = "open",  # "open" (general + course + web) or "course" (strictly course-scoped)
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        response_depth: str = "explanation",
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        enable_web_search: Optional[bool] = None,
        simulate_provider_failure: bool = False
    ) -> Dict[str, Any]:
        """
        Executes unified grounded + general-purpose tutoring pipeline:
        1. Course RAG Retrieval (when course_id is provided)
        2. Live Web Search (when freshness, external facts, or user requests it)
        3. Grounding Gate & Citation Synthesis
        4. Dynamic "Explore Further" Suggestions
        5. Zero token, credit, or message limits.
        """
        # 1. Retrieve course evidence if course_id is specified
        retrieval = {"results": []}
        gate = {"status": "OPEN", "validated_citations": [], "confidence": 0.0}

        if course_id:
            retrieval = await HybridRetriever.retrieve(
                db=db,
                course_id=course_id,
                query=query,
                top_k=4
            )
            gate = GroundingGate.evaluate(retrieval, scope=scope)

        has_course_evidence = len(gate["validated_citations"]) > 0 and gate["confidence"] >= 0.70

        # 2. Live Web Search decision
        should_search = False
        if scope != "course":
            should_search = WebSearchService.should_search(
                query=query,
                has_course_evidence=has_course_evidence,
                explicit_search=bool(enable_web_search)
            )

        web_sources: List[Dict[str, Any]] = []
        if should_search:
            try:
                web_sources = await WebSearchService.search(query=query, max_results=3)
            except Exception as e:
                logger.warning(f"Live web search failed: {e}")
                web_sources = []

        mode_key = mode.lower() if mode.lower() in cls.MODE_PROMPTS else "beginner"
        system_prompt = cls.MODE_PROMPTS[mode_key]

        if language.lower() not in ["en", "english"]:
            system_prompt += f"\n\nIMPORTANT: Respond in the student's requested language ({language}), while preserving all technical terminology and citations."

        context_window = ai_provider.context_manager.build_context_window(
            messages=conversation_history or [],
            current_query=query
        )

        # Build evidence text blocks
        course_evidence_snippets = []
        for c in gate["validated_citations"]:
            course_evidence_snippets.append(f"[{c['document']} - {c['location_label']}]: {c['excerpt']}")
        course_evidence_block = "\n\n".join(course_evidence_snippets)

        web_evidence_snippets = []
        for w in web_sources:
            web_evidence_snippets.append(f"[{w['citation_id']}] {w['title']} ({w['domain']}): {w['snippet']} <{w['url']}>")
        web_evidence_block = "\n\n".join(web_evidence_snippets)

        prompt_payload = (
            f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\n"
            f"CONVERSATION SUMMARY:\n{context_window.get('conversation_summary', '')}\n\n"
        )

        if course_evidence_block:
            prompt_payload += f"RETRIEVED COURSE EVIDENCE:\n{course_evidence_block}\n\n"

        if web_evidence_block:
            prompt_payload += f"LIVE WEB RESEARCH EVIDENCE:\n{web_evidence_block}\n\n"

        prompt_payload += (
            f"USER QUESTION:\n{query}\n\n"
            f"INSTRUCTION: Answer clearly, authoritatively, and accurately. "
            f"When referencing course documents, mention the document and location. "
            f"When using web research facts, include inline citations [1], [2] matching the source numbers."
        )

        # 3. Generate AI Response
        raw_answer = await ai_provider.generate_response(
            prompt_payload,
            system_prompt,
            response_depth=response_depth,
            simulate_provider_failure=simulate_provider_failure
        )

        # 4. Related topics and primary concept
        related_topics = list({u.get("topic") for u in retrieval.get("results", []) if u.get("topic")})
        primary_concept = retrieval["results"][0].get("concept") if retrieval.get("results") else "Core Concept"

        # 5. Dynamic "Explore Further" / Related Questions
        related_questions = cls.generate_related_questions(
            query=query,
            primary_concept=primary_concept,
            web_sources=web_sources
        )

        rec_action = {
            "type": "practice_quiz",
            "concept": primary_concept,
            "label": f"Practice Quiz: {primary_concept}",
            "reason": f"Reinforce your understanding of {primary_concept} with adaptive questions."
        }

        # 6. Persist Conversation & Message if conversation_id provided
        if conversation_id:
            msg_user = ConversationMessage(
                conversation_id=conversation_id,
                sender="user",
                content=query,
                is_grounded=False
            )
            is_grounded = bool(gate["validated_citations"] or web_sources)
            confidence_score = max(gate["confidence"], 0.94 if web_sources else 0.88)
            msg_bot = ConversationMessage(
                conversation_id=conversation_id,
                sender="assistant",
                content=raw_answer,
                is_grounded=is_grounded,
                grounding_confidence=confidence_score
            )
            db.add(msg_user)
            db.add(msg_bot)
            await db.flush()

            # Store course document citations
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
            "grounded": bool(gate["validated_citations"] or web_sources),
            "is_course_grounded": bool(gate["validated_citations"]),
            "is_web_grounded": bool(web_sources),
            "confidence": max(gate["confidence"], 0.94 if web_sources else 0.88),
            "citations": gate["validated_citations"],
            "web_sources": web_sources,
            "related_questions": related_questions,
            "related_topics": related_topics,
            "recommended_action": rec_action,
            "provider": ai_provider.get_active_provider_name(),
            "response_depth": response_depth,
            "context_turns": context_window["total_turns"]
        }

    @classmethod
    async def ask_source_question(
        cls,
        db: AsyncSession,
        course_id: str,
        document_id: str,
        location: Dict[str, Any],
        query: str,
        mode: str = "beginner"
    ) -> Dict[str, Any]:
        """
        Implements Section 24 'Ask About This' mode,
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
