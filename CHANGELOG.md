# Changelog

All notable changes to the **EduPath AI — Multimodal Adaptive Learning Companion** platform will be documented in this file.

## [1.2.0] - 2026-10-13

### Added
- **Day & Night Adaptive Theme Architecture**:
  - Implemented `ThemeContext` with reactive `useTheme()` hook and automatic `localStorage` persistence (`edupath_theme_v1`).
  - Added dedicated Day/Night toggle button in the top navigation bar with animated Sun / Moon indicators and instant state transitions.
  - **Day Mode (Light)**: High-contrast lavender-slate canvas (`#f4f5fd`), crisp white cards (`#ffffff`), and soft indigo-tinted accents matching the official design specification.
  - **Night Mode (Dark)**: Deep **True Black canvas (`#000000`)** instead of violet, sleek black-charcoal cards (`#0a0b10`), and dark borders (`#1a1c26`).
  - Added customized theme-aware scrollbars for both Day (`#f4f5fd` track, `#cbd5e1` thumb) and Night (`#000000` track, `#27272a` thumb).
- **Pixel-Perfect Dashboard Components**:
  - Circular Course Mastery Ring Gauge rendering an animated SVG progress circle with centered percentage (`69%`), `Course mastery` label, and `Proficient` status badge.
  - 7-segment gold progress pills for consecutive Study Streak tracking (`+15% XP boost`).
  - Gamified XP progress meter with `Level 6` indicator and `Next rank` guidance.
  - Bayesian Recommended Next Action card with calibrated 3-step action checklist (`STEP 1 Review slides`, `STEP 2 Micro quiz`, `STEP 3 Blitz revision`).
  - Explainable AI "Why Am I Weak?" diagnostic card with Detected Misconception alerting and Prerequisite Gap Tracing bars.

### Improved
- Global CSS layers in `index.css` to guarantee high contrast across all pages, modals, and drawers in both Day and Night modes.
- Production build optimization with Vite 6.1 and React 19.

---

## [1.1.0] - 2026-10-12

### Added
- **AI Unlimited Learning Mode**:
  - Completely removed all application-level token, credit, quota, and question limits.
  - Added informational learning metrics bar (Mastery %, Current Phase, Questions Asked, Active Sources).
  - Implemented `ConversationContextManager` supporting 20+ multi-turn questions with context memory and follow-up resolution.
  - Added general-purpose AI capabilities for computer science, algorithms (Two Sum, Binary Search), systems, and AI/ML.
  - Supported unlimited Phase Quizzes ("Give me another quiz") and unlimited Grand Quiz retakes.
  - Added graceful `**AI service temporarily unavailable**` fallback handling.
