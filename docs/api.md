# EduPath AI — REST API Specification

The EduPath AI backend exposes an asynchronous REST API structured across 13 modular routers. All endpoints are prefixed with `/api` and return standardized JSON responses.

---

## 1. Authentication & Learner Session (`/api/auth`)
- `POST /api/auth/register`: Register new student account (`username`, `email`, `password`, `full_name`).
- `POST /api/auth/login`: Authenticate credentials, issues JWT Bearer token.
- `GET /api/auth/demo`: Retrieves or provisions pre-calibrated demo learner profile (Alex Rivera) for zero-setup exploration.
- `GET /api/auth/me`: Fetches profile details for the authenticated user.

## 2. Courses & Multimodal Ingestion (`/api/courses`)
- `GET /api/courses`: Lists all registered courses.
- `POST /api/courses`: Creates a new course entity (`code`, `title`, `description`, `domain`).
- `GET /api/courses/{course_id}`: Retrieves course metadata, ingested document count, and concept taxonomy.
- `POST /api/courses/upload`: Multipart upload accepting `.pdf`, `.pptx`, `.docx`, `.txt`, `.mp4` files. Triggers asynchronous chunking, taxonomy derivation, and vector indexing.

## 3. Grounded AI Tutor (`/api/tutor`)
- `POST /api/tutor/ask`: Submits a student prompt with tutoring mode (`beginner`, `exam`, `deep_dive`, `socratic`, `interview`, `bilingual`) and optional scope location. Returns grounded answer, confidence score, and citation list.
- `POST /api/tutor/source-question`: Queries a specific source chunk (page, slide, or timestamp) directly from the course explorer.

## 4. Assessment & Diagnostics (`/api/assessment`)
- `GET /api/assessment/diagnostic/{course_id}`: Returns calibrated diagnostic assessment questions.
- `GET /api/assessment/practice/{course_id}`: Returns practice questions for a specific topic.
- `POST /api/assessment/evaluate`: Evaluates student choice, runs misconception detection, updates learner mastery, and returns a 2-minute remediation plan if incorrect.

## 5. Learner Model & Mastery (`/api/learner`)
- `GET /api/learner/profile/{user_id}`: Returns overall course mastery, level, XP, and streak.
- `GET /api/learner/why-weak/{user_id}/{topic_id}`: Explainable diagnostic breakdown returning identified misconceptions and prerequisite gap tree.
- `GET /api/learner/timeline/{user_id}`: Returns chronological stream of learning events.

## 6. Recommendations (`/api/recommendations`)
- `GET /api/recommendations/{user_id}/{course_id}`: Computes Next Best Action using dynamic Bayesian mastery and prerequisite gaps.

## 7. Knowledge Graph & Source Explorer (`/api/knowledge`)
- `GET /api/knowledge/graph/{course_id}`: Returns SVG-ready nodes, coordinates, prerequisite edges, and student mastery colors.
- `GET /api/knowledge/sources/{course_id}`: Returns hierarchical tree of documents, pages, slides, and video timestamps.

## 8. Spaced Repetition Flashcards (`/api/flashcards`)
- `GET /api/flashcards/due/{course_id}`: Returns cards scheduled for review today.
- `POST /api/flashcards/review`: Processes SuperMemo SM-2 quality rating (0 to 5) and updates interval and ease factor.

## 9. Study Planner & Blitz (`/api/planner`)
- `GET /api/planner/{user_id}/{course_id}`: Retrieves daily milestones and pacing targets.
- `POST /api/planner/blitz`: Generates an emergency high-yield revision curriculum given available hours (1 to 8).

## 10. Exam Simulator (`/api/exams`)
- `POST /api/exams/generate`: Generates timed mock exam across course topics.
- `POST /api/exams/submit`: Evaluates full exam submission and returns readiness report.

## 11. Coding Laboratory (`/api/coding`)
- `POST /api/coding/execute`: Executes code in sandboxed environment after AST pre-audit check.

## 12. Educational Mini-Games (`/api/games`)
- `GET /api/games/{game_type}`: Returns dataset for Term Match, Algorithm Ordering, or Flash Recall.
- `POST /api/games/submit-score`: Awards gamification XP for completed games.

## 13. System Revision Generator (`/api/revision`)
- `POST /api/revision/generate`: Generates rapid summaries and cheat sheets for weak concepts.
