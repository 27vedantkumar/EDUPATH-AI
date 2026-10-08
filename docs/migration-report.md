# EduPath AI — Migration Report

> **Mapping legacy capabilities from EduPath and AI Study Buddy into the unified platform.**

---

## 1. Migration Overview

EduPath AI unifies two complementary repositories into a cohesive, production-ready system:
- **Project A (EduPath)**: Contributed the skill gap engine, dynamic dependency roadmap, SVG skill graph, diagnostic self-assessment quizzes, and multilingual localization.
- **Project B (AI Study Buddy)**: Contributed the 6-mode AI tutor, "Why Was I Wrong?" misconception analysis, coding laboratory, mini-games, flashcards, smart notes, and study planner.

---

## 2. Feature Migration & Refactoring Map

| Legacy Feature | Legacy Origin | Action (Reuse / Refactor / Replace) | New Unified Location |
|:---|:---|:---|:---|
| **Interactive Skill Graph** | EduPath (`SkillGraph.jsx`) | **Refactor & Elevate**: Converted from static SVG into dynamic, interactive Course Knowledge Graph linked to live concept mastery vectors and prerequisites. | `frontend/src/features/knowledge/KnowledgeGraph.jsx` |
| **Skill Gap Engine & Roadmap** | EduPath (`skill_gap.py`, `roadmap_engine.py`) | **Refactor**: Replaced hardcoded career skills with dynamic Course Knowledge Graph prerequisite dependencies and topological ordering. | `backend/app/services/knowledge_graph.py`, `backend/app/services/recommendation.py` |
| **Diagnostic Assessment Quiz** | EduPath (`SelfAssessmentQuiz.jsx`) | **Refactor**: Connected to initial course diagnostic assessment pipeline with baseline mastery initialization. | `backend/app/assessment/diagnostic.py`, `frontend/src/features/assessments/DiagnosticQuiz.jsx` |
| **Multilingual AI Mentor & TTS** | EduPath (`ChatBot.jsx`, `translations.js`) | **Reuse & Extend**: Reused 15-language dictionary, speech synthesis/recognition hooks, and extended to ground citations in original source language. | `frontend/src/features/tutor/VoiceTutor.jsx`, `frontend/src/i18n/` |
| **6-Mode AI Tutor** | AI Study Buddy (`tutor.py`, `AITutor.jsx`) | **Refactor & Ground**: Integrated with RAG Grounding Gate, Source-Scoped Chat, and Verified Citations so personas share the exact same knowledge base and learner model. | `backend/app/ai/tutor.py`, `frontend/src/features/tutor/GroundedTutor.jsx` |
| **"Why Was I Wrong?" Engine** | AI Study Buddy (`routes_quizzes.py`, `Quizzes.jsx`) | **Elevate & Formalize**: Standardized into Misconception Detection & Remediation Engine with cited source evidence and adaptive follow-up questions. | `backend/app/assessment/misconception.py`, `frontend/src/features/assessments/WhyWasIWrongModal.jsx` |
| **Coding Laboratory** | AI Study Buddy (`code_runner.py`, `CodingLab.jsx`) | **Harden & Secure**: Replaced bare host execution with isolated process execution, resource quotas, timeouts, memory limits, and AST security validation. | `backend/app/security/sandbox.py`, `frontend/src/features/coding/CodingLab.jsx` |
| **SuperMemo SM-2 Flashcards** | EduPath & AI Study Buddy (`FlashcardDeck.jsx`) | **Refactor & Merge**: Unified flashcards into source-backed, topic-linked spaced repetition deck updating the learner mastery model upon review. | `backend/app/services/flashcards.py`, `frontend/src/features/flashcards/` |
| **Study Planner & Blitz Revision** | AI Study Buddy (`routes_planner.py`, `StudyPlanner.jsx`) | **Refactor**: Linked planner directly to learner mastery, forgetting risk curves, upcoming exam target dates, and dynamic recalculation. | `backend/app/services/planner.py`, `frontend/src/features/planner/` |
| **Mini-Games & Gamification** | AI Study Buddy (`routes_games.py`, `Games.jsx`) | **Refactor**: Retained 4 learning games (Term Match, Code Order, Flash Recall, Speed Quiz), but bound XP and streaks directly to verified mastery milestones. | `backend/app/services/gamification.py`, `frontend/src/features/gamification/` |
| **Document Parsing** | Both (`doc_parser.py`, `document_parser.py`) | **Replace with Pipeline**: Replaced simple text extractors with complete Multimodal Ingestion Pipeline supporting PDF, DOCX, TXT, PPT/PPTX, Images, and Video with timestamps. | `backend/app/ingestion/multimodal_service.py` |
| **Mock / Offline Fallback** | Both | **Standardize**: Clearly demarcated LIVE MODE vs DEMO MODE with high-fidelity, grounded educational course dataset (Operating Systems OS 101). | `backend/app/ai/provider.py`, `scripts/seed_demo_course.py` |

---

## 3. Deprecated & Removed Code

1. **Unsafe Subprocess Execution**: Legacy `code_runner.py` executed arbitrary code on the host machine without sandboxing. This was completely replaced by `backend/app/security/sandbox.py`.
2. **Disconnected Persona Prompts**: Legacy AI tutor personas had disconnected prompt texts with no course grounding. They are now unified under `GroundedTutorService`.
3. **Hardcoded Mock APIs**: Legacy frontend mock interceptors that fabricated random success responses have been removed in favor of persisted SQLite/PostgreSQL entities and deterministic seed course data.
