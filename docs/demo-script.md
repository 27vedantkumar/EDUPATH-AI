# EduPath AI — Hackathon Demonstration Scripts

This document provides clear, reproducible step-by-step presentation scripts for demonstrating **EduPath AI — Multimodal Adaptive Learning Companion** to judges, mentors, and hackathon audiences.

---

## 3-Minute Lightning Demo (Executive Impact)

### 0:00 - 0:30 • The Problem & The Big Idea
- **Presenter:** "Students drown in multimodal materials: 600-page textbook PDFs, 40-slide PPTX decks, and 2-hour lecture recordings. Generic AI chatbots fail because they hallucinate facts and lack learner awareness.
- **Action:** Open `http://localhost:5173`. Show the **EduPath AI Dashboard** with live Learner Mastery score (62%), level, and streak.
- **Presenter:** "EduPath AI unifies multimodal course knowledge, dynamic Bayesian learner tracking, and zero-hallucination source grounding into one companion."

### 0:30 - 1:15 • True Source Addressability & Multimodal Grounding
- **Action:** Click **Grounded Tutor** tab.
- **Prompt:** Click suggested prompt: *"What visual diagram is shown on Slide 18?"*
- **Observation:** Notice the response immediately outputs:
  - Evidence: Resource Allocation Graph with cycle between P1, P2 and R1, R2.
  - Verified Green Badge: `100% Grounded in Course Material`.
  - Citation chip: `OS_Lecture7.pptx • Slide 18`.
- **Action:** Click on the citation chip. Show the system jump to the **Source Explorer** displaying the exact extracted slide content and presenter notes.

### 1:15 - 2:00 • Video Timestamp Navigation
- **Action:** In Source Explorer, click on `Lecture7_Video_Recording.mp4`.
- **Observation:** Show the timestamped video segments (`21:43 - 22:17: Deadlock Avoidance & Safe States`).
- **Presenter:** "EduPath doesn't pretend to understand video; it segments real lecture speech, tags concepts, and enables students to seek straight to the relevant second."

### 2:00 - 2:40 • "Why Was I Wrong?" & Explainable Remediation
- **Action:** Navigate to **Adaptive Assessment**.
- **Action:** Answer Question 2 ("If a system enters an Unsafe State..."): Deliberately pick Distractor A: *"The system is already deadlocked."*
- **Action:** Click **Submit**. Observe the red feedback and click **"Why Was I Wrong?"**.
- **Observation:** Modal reveals:
  - Detected Misconception: *"Equates Unsafe State directly with Deadlock."*
  - Prerequisite Gap: *"Safe Sequences"*
  - 2-Minute Grounded Remediation excerpt from Chapter 7.
- **Presenter:** "EduPath doesn't just grade with right or wrong. It pinpoints the exact cognitive flaw and remediates it instantly."

### 2:40 - 3:00 • Live Knowledge Graph & Closing
- **Action:** Click **Knowledge Graph** tab.
- **Observation:** Show the interactive SVG network with color-coded nodes (Green for Mastered, Red for Weak, locked prerequisite arrows).
- **Presenter:** "EduPath AI transforms raw course files into active, adaptive human mastery. Thank you!"

---

## 5-Minute Comprehensive Presentation

1. **Architecture Walkthrough (1:00)**: Introduce the Shared Intelligence Triangle (Knowledge Base, Learner Model, Adaptive Engine).
2. **Multimodal Ingestion Pipeline (1:00)**: Show Ingestion Modal, drag-and-drop PDF/PPTX/MP4, explain semantic chunking with source retention.
3. **Grounding Gate & Refusal Verification (1:00)**: Demonstrate that querying *"What is Apple's 1999 stock price?"* returns a strict zero-hallucination refusal.
4. **Adaptive Assessment & Socratic Tutoring (1:00)**: Show how an incorrect diagnostic triggers Socratic Mode tutor with tailored guiding questions.
5. **Flashcards & Study Planner (1:00)**: Showcase SuperMemo SM-2 interval scheduler and high-yield Blitz revision generator.

---

## 10-Minute Technical Deep Dive

1. **System & Security Architecture (2:00)**: Explain AST code audit sandbox, async SQLite database with 30 relational entities, and JWT auth flow.
2. **Hybrid RAG & Reciprocal Rank Fusion (2:00)**: Dense vector similarity + Okapi BM25 lexical retrieval fused via RRF ($k=60$).
3. **Bayesian-Hybrid Mastery Algorithm (2:00)**: Explain formula $\Delta = \alpha \cdot (Target - Current) \cdot Difficulty \cdot Confidence$ and status thresholds.
4. **Benchmark Evaluation Suite (2:00)**: Run `python -m evaluation.runner` live in terminal, displaying 100% Faithfulness, 100% Context Precision, 100% Refusal Accuracy, and Strong/Average/Struggling student simulations.
5. **Interactive UI Walkthrough & Q&A (2:00)**: Demonstrate Coding Lab sandbox executing Banker's Algorithm, educational mini-games, and take judge questions.
