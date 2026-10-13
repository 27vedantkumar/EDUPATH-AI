# Changelog

All notable changes to the **EduPath AI — Multimodal Adaptive Learning Companion** platform will be documented in this file.

## [1.3.0] - 2026-10-14

### Added
- **4-Theme System (2 Day + 2 Night) Matching Design Specification**:
  - **Day 1 • Warm Peach (Page 1)**: Warm cream canvas (`#fbf5ee`), apricot welcome banner (`#fed8cd`), yellow course pill (`#fef08a`), peach ingest button (`#fed8cd`), black action buttons, peach remediation pill (`#fed8cd`), and golden Socratic pill (`#fef08a`) with crisp borders.
  - **Day 2 • Soft Rose (Page 2)**: Blush rose canvas (`#fcf2f4`), soft rose welcome banner (`#fce3e8`), rose course pill (`#fce7f3`), blush ingest button (`#fdd9e0`), and lavender Socratic pill (`#f3e8ff`).
  - **Night 1 • Midnight Indigo (Page 3)**: Deep midnight navy canvas (`#0c0e1d`), violet welcome banner (`#21274a`), mint course pill (`#6ee7b7`), vibrant periwinkle ingest button (`#818cf8`), and mint Socratic pill (`#6ee7b7`).
  - **Night 2 • Cyber Emerald (Page 4)**: Obsidian forest canvas (`#071312`), deep emerald banner (`#173330`), lime course pill (`#fef08a`), bright seafoam ingest button (`#5eead4`), and lime Socratic pill (`#fef08a`).
- **Interactive 4-Theme Picker & Day/Night Toggle**:
  - Quick dropdown in top navigation bar to select any of the 4 themes with live swatches.
  - Dedicated Sun/Moon toggle button that seamlessly transitions between active Day and Night palettes while preserving user preferences.
  - Distinctive bordered button arrangements (`border-[1.5px] border-slate-900`) matching the PDF design.

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
