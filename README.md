# EduPath AI — Multimodal Adaptive Learning Companion

[![Live Deployment](https://img.shields.io/badge/Live_Deployment-GitHub_Pages-6366f1.svg?style=for-the-badge&logo=github)](https://manas0306-ops.github.io/MultiModal-Study-Platform/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Backend](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)]()
[![Frontend](https://img.shields.io/badge/React-19.0+-61DAFB.svg?logo=react)]()
[![Database](https://img.shields.io/badge/SQLAlchemy-Async_ORM-red.svg)]()
[![Grounding](https://img.shields.io/badge/Grounding_Gate-Live_Web_+_RAG-indigo.svg)]()

> **🚀 LIVE APPLICATION URL:**  
> **[https://manas0306-ops.github.io/MultiModal-Study-Platform/](https://manas0306-ops.github.io/MultiModal-Study-Platform/)**  
> *(Click above or open via the repository's "Deployments" section on the right sidebar)*
>
> ⚡ **Hackathon Evaluator 1-Click Access:** When opening the application, click **"⚡ 1-Click Evaluator Demo Access (Alex Rivera)"** for instant, fully verified access with pre-seeded course mastery, flashcards, and diagnostic state! Alternatively, register with any valid email address.

---

## 🌟 The Shared Intelligence Triangle

EduPath AI is built around three foundational, tightly integrated layers:

```
                         ┌──────────────────────────────────────┐
                         │      React 19 + Tailwind Client      │
                         └──────────────────┬───────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         │                                  │                                  │
    Grounded Tutor                  Knowledge Graph                  Adaptive Assessment
         │                                  │                                  │
         └──────────────────────────────────┼──────────────────────────────────┘
                                            │
                         ┌──────────────────▼──────────────────┐
                         │       Adaptive Learning Engine      │
                         └──────────────────┬──────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
         ┌──────────────────────┐                       ┌──────────────────────┐
         │    Learner Model     │                       │    Multimodal KB     │
         │ (Mastery, Errors, XP)│                       │(PDF, PPTX, MP4, DOCX)│
         └──────────────────────┘                       └──────────────────────┘
```

1. **Multimodal Knowledge Base**: Ingests textbook PDFs, slide decks (PPTX), lecture video recordings (MP4 with timestamp boundaries), documents (DOCX), and images. Retains exact source addressability down to the page, slide number, and video timestamp (e.g. `21:43`).
2. **Explainable Learner Model**: Tracks topic and concept mastery on a continuous scale (0.00–1.00), diagnoses cognitive misconceptions, and maps prerequisite knowledge gaps.
3. **Adaptive Learning Engine**: Determines the Next Best Action, orchestrates Socratic tutoring, generates calibrated diagnostics, and powers SuperMemo SM-2 spaced repetition.

---

## 🚀 Core Features

- **Universal Authentication & Mailbox Verification**: Production-grade database-backed accounts accepting any email domain, single-use cryptographic token verification, secure HTTP-only cookies, password recovery, and 1-Click Evaluator access.
- **General-Purpose AI & Live Web Grounding**: Answers open-ended coding, math, writing, and engineering questions with live web search via authoritative sources (Wikipedia, docs, primary publications), SSRF-safe URL validation, clickable source cards, and dynamic "Explore further" suggestions.
- **10-Game Learning Arcade**: Comprehensive gamified arcade including **Code Rush** (Speed), **Bug Hunter** (Debugging), **Output Predictor** (Logic), **Memory Match** (Recall), **Flashcard Battle** (Speed Combos), **Algorithm Maze** (Adventure), **Typing Code** (WPM), **Binary Battle** (Architecture), **SQL Detective** (Murder Mystery), and **AI Quiz Boss** (RPG Raid).
- **Floating AI Study Buddy**: Global floating assistant widget (`✨ Ask AI Study Buddy`) accessible from any screen with quick live search toggles and instant responses.
- **Day & Night Adaptive Theme**: Seamless theme switching between **Day Mode** (soft peach/rose canvases) and **Night Mode** (deep **True Black `#000000`** and indigo surfaces), persisted via `localStorage` and accessible from the top navigation bar.
- **Grounded AI Tutor**: 6 distinct tutoring modes (*Beginner*, *Exam*, *Deep Dive*, *Socratic*, *Interview*, *Bilingual*) with live course citations, audio read-aloud TTS, and 3-Phase Adaptive Studio integration.
- **Interactive Knowledge Graph**: SVG visual topology with pan, zoom, mastery color-coding, prerequisite locks, and click-to-remediate drawers.
- **Source Explorer**: Hierarchical course repository allowing students to inspect original textbook pages, slide presenter notes, and seek directly to video lecture timestamps (`21:43`).
- **Adaptive Assessment & "Why Was I Wrong?"**: Calibrated diagnostic quizzes diagnosing exact misconceptions and prerequisite gaps with 2-minute targeted remediation.
- **SuperMemo SM-2 Flashcards**: Spaced-repetition deck with 3D interactive flip cards, quality ratings (0 to 5), and dynamic interval recalculation.
- **Adaptive Study Planner & Blitz Revision**: Daily schedule planner and emergency Blitz generator for high-yield pre-exam preparation (1h–8h).
- **Exam Simulator**: Timed midterm/final simulator with countdown clock and readiness breakdown.
- **Concurrency Coding Lab**: In-browser code editor with sandboxed execution protected by AST pre-audit checks.

---

## 📊 Benchmark Evaluation Results

Run the automated evaluation suite using `python -m evaluation.runner`:

| Metric | Benchmark Target | Evaluated Result | Status |
| :--- | :--- | :--- | :--- |
| **Faithfulness** | > 85.0% | **100.0%** | PASS |
| **Context Precision** | > 80.0% | **100.0%** | PASS |
| **Citation Accuracy** | > 90.0% | **100.0%** | PASS |
| **Refusal Accuracy** | > 90.0% | **100.0%** | PASS |
| **Multimodal Addressability** | > 85.0% | **100.0%** | PASS |

---

## 🛠️ Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 20+ / npm 10+
- (Optional) Docker & Docker Compose

### 1. Clone & Set Up Backend

```bash
# Clone the repository
git clone https://github.com/manas0306-ops/MultiModal-Study-Platform.git
cd MultiModal-Study-Platform

# Install Python dependencies
pip install -r requirements.txt

# Seed the demo course with textbook PDF, slides PPTX, and lecture MP4
python -m scripts.seed_demo_course

# Launch FastAPI backend
uvicorn backend.app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000/api` (Swagger docs at `http://localhost:8000/docs`).

### 2. Set Up Frontend

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
Frontend will be running at `http://localhost:5173`.

---

## 🐳 Running with Docker Compose

To run the entire full-stack application inside isolated containers:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`

---

## 🧪 Running Tests & Benchmarks

```bash
# Run backend pytest test suite
pytest backend/tests

# Run automated RAG grounding & simulated student evaluation
python -m evaluation.runner
```

---

## 📜 Documentation

- [System Architecture](docs/architecture.md)
- [Legacy Migration Report](docs/migration-report.md)
- [Hackathon Demo Scripts](docs/demo-script.md)
- [REST API Specification](docs/api.md)
- [Evaluation Report](docs/evaluation-report.md)
- [Final Implementation Report](docs/final-report.md)

---

## 👤 Author & Contribution
- **Lead Developer**: Maanas Pandey ([@manas0306-ops](https://github.com/manas0306-ops))
- **Email**: krishnamanas1224@gmail.com
