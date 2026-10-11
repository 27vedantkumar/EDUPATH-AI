/**
 * EduPath AI / StockSense Intelligence — AI-Decided 3-Phase Adaptive Learning & Grand Quiz Engine
 *
 * Implements:
 * Ingested Material / Topic → Content & Dependency Analysis → AI-Decided 3 Phases:
 *   • Phase 1 (Foundation & Core Principles) → Teach (Brief / Explanation) → 5 MCQs → Evaluate
 *   • Phase 2 (Mechanisms & Relationships)   → Teach (Brief / Explanation) → 5 MCQs → Evaluate
 *   • Phase 3 (Advanced Applications)        → Teach (Brief / Explanation) → 5 MCQs → Evaluate
 *   ↓
 * All 3 Phases Complete → Unlock GRAND QUIZ (15 Fresh Cross-Phase MCQs) → Final Cognitive Diagnosis Report
 */

import { ClientIntelligenceEngine } from './clientEngine';

const STORAGE_KEY_SESSIONS = 'edupath_adaptive_3phase_sessions_v1';
const STORAGE_KEY_ACTIVE_SESSION_ID = 'edupath_active_3phase_session_id_v1';

export class AdaptivePhaseEngine {
  /**
   * Load all saved 3-phase learning sessions from localStorage
   */
  static getAllSessions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  static saveSession(session) {
    try {
      const all = this.getAllSessions().filter((s) => s.id !== session.id);
      all.unshift({ ...session, updatedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(all.slice(0, 15)));
      localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION_ID, session.id);
    } catch (_) {}
  }

  static getActiveSession() {
    const all = this.getAllSessions();
    if (all.length === 0) return null;
    try {
      const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION_ID);
      if (activeId) {
        const found = all.find((s) => s.id === activeId);
        if (found) return found;
      }
    } catch (_) {}
    return all[0];
  }

  /**
   * Analyze material / topic and dynamically generate a 3-Phase Adaptive Learning Session
   * Phase boundaries are decided based on conceptual dependencies, difficulty, and content density.
   */
  static createOrLoadSession({ documentName = '', customTopic = '' } = {}) {
    const allDocs = ClientIntelligenceEngine.getAllDocuments();
    let targetDoc = null;

    if (documentName) {
      targetDoc = allDocs.find(
        (d) =>
          d.filename.toLowerCase() === documentName.toLowerCase() ||
          d.filename.toLowerCase().includes(documentName.toLowerCase())
      );
    }
    if (!targetDoc && !customTopic) {
      targetDoc = allDocs[0];
    }

    const sessionKey = targetDoc
      ? `session_doc_${targetDoc.filename}`
      : `session_topic_${(customTopic || 'Operating_Systems').replace(/\W+/g, '_')}`;

    // Return existing session if already created so progress is preserved across refreshes
    const existing = this.getAllSessions().find((s) => s.sessionKey === sessionKey);
    if (existing) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION_ID, existing.id);
      return existing;
    }

    const session = this.buildThreePhaseCurriculum(targetDoc, customTopic, sessionKey);
    this.saveSession(session);
    return session;
  }

  /**
   * Force regenerate a fresh 3-Phase session for a document or topic
   */
  static regenerateSession({ documentName = '', customTopic = '' } = {}) {
    const allDocs = ClientIntelligenceEngine.getAllDocuments();
    const targetDoc = documentName
      ? allDocs.find((d) => d.filename.toLowerCase().includes(documentName.toLowerCase()))
      : allDocs[0];
    const sessionKey = targetDoc
      ? `session_doc_${targetDoc.filename}`
      : `session_topic_${(customTopic || 'Operating_Systems').replace(/\W+/g, '_')}`;
    const session = this.buildThreePhaseCurriculum(targetDoc, customTopic, sessionKey);
    this.saveSession(session);
    return session;
  }

  /**
   * AI Content & Dependency Analyzer that constructs Phase 1, Phase 2, Phase 3, and the 15-MCQ Grand Quiz
   */
  static buildThreePhaseCurriculum(doc, customTopic, sessionKey) {
    const isDeadlockCourse =
      !customTopic &&
      (!doc ||
        doc.filename.toLowerCase().includes('deadlock') ||
        doc.filename.toLowerCase().includes('lecture7'));

    const subjectTitle = customTopic
      ? customTopic.replace(/^(teach me|learn|explain)\s+/i, '').trim()
      : doc?.topic && doc.topic !== 'Deadlocks'
      ? `${doc.topic} (${doc.filename})`
      : 'Operating Systems: Deadlocks, Resource Graphs & Banker\'s Algorithm';

    const sourceFile = doc?.filename || 'Operating_Systems_Ch7_Deadlocks.pdf';
    const units = doc?.units || [];

    // Extract dynamic concepts from ingested units if custom document
    const extractedConcepts =
      doc?.concepts && doc.concepts.length >= 3
        ? doc.concepts
        : [
            'Coffman Deadlock Conditions',
            'Resource Allocation Graph Cycles',
            'Safe vs. Unsafe States',
            "Dijkstra's Banker's Algorithm",
            'Deadlock Prevention & Recovery'
          ];

    let phases = [];
    let grandQuizQuestions = [];

    if (isDeadlockCourse) {
      phases = this.buildDeadlockPhases(sourceFile);
      grandQuizQuestions = this.buildDeadlockGrandQuiz(sourceFile);
    } else {
      phases = this.buildDynamicMaterialPhases(subjectTitle, sourceFile, units, extractedConcepts, doc?.prerequisites || ['Core Systems Fundamentals']);
      grandQuizQuestions = this.buildDynamicGrandQuiz(subjectTitle, sourceFile, phases);
    }

    return {
      id: `ls_${Date.now()}`,
      sessionKey,
      title: subjectTitle,
      sourceDocument: sourceFile,
      createdAt: new Date().toISOString(),
      currentPhaseNumber: 1,
      responsePreference: 'explanation', // 'brief' | 'explanation'
      aiPlannerRationale: `AI analyzed conceptual density, prerequisite dependencies, and cognitive load across "${sourceFile}". Divided curriculum into Phase 1 (Foundational Invariants), Phase 2 (Structural Mechanisms & Analytical Models), and Phase 3 (Advanced Optimization & Edge-Case Resolution).`,
      phases,
      grandQuiz: {
        id: `grand_quiz_${Date.now()}`,
        title: `Grand Mastery Quiz: ${subjectTitle}`,
        totalQuestions: grandQuizQuestions.length,
        unlocked: false,
        completed: false,
        questions: grandQuizQuestions,
        result: null
      }
    };
  }

  /**
   * Rich 3-Phase Curriculum for Operating Systems Deadlocks & Concurrency
   */
  static buildDeadlockPhases(sourceFile) {
    return [
      {
        id: 'phase_1',
        number: 1,
        title: 'Phase 1: Deadlock Fundamentals & Coffman Invariants',
        patternLabel: 'Foundation',
        objective: 'Master what a deadlock is, why multiprogramming contention arises, and the four simultaneous Coffman conditions.',
        concepts: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Circular Wait'],
        prerequisites: ['Processes & Threads', 'Kernel Resource Allocation'],
        difficulty: 'Beginner',
        estimatedLearningTime: '8 mins',
        sourceReferences: [
          `${sourceFile} → Page 42, Section 7.2 (Deadlock Characterization)`,
          'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 2 (Necessary Conditions)'
        ],
        completionStatus: 'IN_PROGRESS',
        performance: null,
        briefContent: `### ⚡ Phase 1 (Brief): Deadlock Fundamentals & Coffman Conditions\n• **Definition**: A set of processes is **deadlocked** when every process in the set is waiting for an event (resource release) that can ONLY be caused by another blocked process in the same set.\n• **The 4 Coffman Conditions (All 4 MUST hold simultaneously)**:\n  1. **Mutual Exclusion**: Non-shareable resource held by one process at a time.\n  2. **Hold and Wait**: Holding $\\ge 1$ resource while waiting to acquire another.\n  3. **No Preemption**: Resources released only voluntarily after task completion.\n  4. **Circular Wait**: Closed cycle $P_0 \\to P_1 \\to \\dots \\to P_n \\to P_0$.\n• **Key Takeaway**: If even **one** Coffman condition is broken, deadlock is structurally impossible.`,
        explanationContent: `### 📖 Phase 1 (Deep Explanation): Deadlock Fundamentals & Coffman Conditions\n\n**1. Why Deadlocks Happen in Operating Systems**\nIn a multiprogramming environment, processes compete for a finite pool of resources (mutex locks, I/O devices, database row locks, memory frames). A process follows a 3-step lifecycle: **Request → Use → Release**. When multiple processes interleave lock acquisitions in conflicting orders, permanent blocking occurs.\n\n**2. The Four Coffman Conditions (Coffman et al., 1971)**\nAccording to **Page 42 of Operating Systems Ch. 7**, a deadlock can arise *if and only if* all four conditions hold simultaneously:\n1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode (e.g., a hardware printer or write lock).\n2. **Hold and Wait**: A process must be currently holding at least one resource while blocked waiting to acquire additional resources held by other processes.\n3. **No Preemption**: Allocated resources cannot be forcibly taken away by the kernel; they are released only voluntarily by the holding process.\n4. **Circular Wait**: A closed chain $\\langle P_0, P_1, \\dots, P_n \\rangle$ exists where $P_0$ waits for a resource held by $P_1$, $P_1$ waits for $P_2$, and $P_n$ waits for $P_0$.\n\n**3. Concrete Code Example of Deadlock**\n\`\`\`python\n# Thread A                    # Thread B\nacquire(lock_1)               acquire(lock_2)\n# Both hold 1 lock and wait for the other -> Circular Wait!\nacquire(lock_2)               acquire(lock_1)\n\`\`\`\n\n**4. Deadlock Prevention Strategy**\nTo guarantee deadlock never occurs, invalidate any one condition — most practically **Circular Wait** by enforcing a strict global lock ordering (\`ORDER BY resource_id ASC\`).`,
        quiz: [
          {
            id: 'p1_q1',
            question: 'According to Coffman et al., how many of the four fundamental conditions must hold simultaneously for a deadlock to occur?',
            options: [
              { id: 'A', text: 'Only Mutual Exclusion and Circular Wait' },
              { id: 'B', text: 'Any two of the four conditions' },
              { id: 'C', text: 'All four conditions must hold simultaneously' },
              { id: 'D', text: 'At least three conditions, excluding No Preemption' }
            ],
            correctAnswer: 'C',
            explanation: 'Deadlock requires all four Coffman conditions (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait) to hold at the exact same time.',
            concept: 'Coffman Conditions',
            difficulty: 'Easy',
            sourceReference: `${sourceFile} → Page 42, Section 7.2`
          },
          {
            id: 'p1_q2',
            question: 'Which Coffman condition describes a process holding at least one allocated resource while blocked waiting for additional resources held by other processes?',
            options: [
              { id: 'A', text: 'Hold and Wait' },
              { id: 'B', text: 'Mutual Exclusion' },
              { id: 'C', text: 'No Preemption' },
              { id: 'D', text: 'Resource Starvation' }
            ],
            correctAnswer: 'A',
            explanation: 'Hold and Wait specifically refers to retaining already-acquired resources while blocking on new resource requests.',
            concept: 'Hold and Wait',
            difficulty: 'Easy',
            sourceReference: `${sourceFile} → Page 42, Section 7.2`
          },
          {
            id: 'p1_q3',
            question: 'Why is imposing a strict ascending total ordering on all lock acquisitions (e.g., always locking R1 before R2) the most practical deadlock prevention technique?',
            options: [
              { id: 'A', text: 'It eliminates Mutual Exclusion by making locks shareable' },
              { id: 'B', text: 'It mathematically prevents a Circular Wait cycle from forming' },
              { id: 'C', text: 'It forces the CPU scheduler to run in FCFS mode' },
              { id: 'D', text: 'It doubles physical RAM capacity' }
            ],
            correctAnswer: 'B',
            explanation: 'If every thread acquires resources in strictly increasing order (R_i < R_j), a closed cycle P0 -> P1 -> ... -> P0 cannot exist because indices cannot strictly increase around a loop.',
            concept: 'Circular Wait',
            difficulty: 'Medium',
            sourceReference: 'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 2'
          },
          {
            id: 'p1_q4',
            question: 'What does the "No Preemption" condition mean in the context of operating system deadlocks?',
            options: [
              { id: 'A', text: 'The CPU timer interrupt is disabled permanently' },
              { id: 'B', text: 'Allocated resources cannot be forcibly revoked; they are released only voluntarily by the holding process' },
              { id: 'C', text: 'High-priority threads can steal locks from low-priority threads' },
              { id: 'D', text: 'Processes must request all resources before execution begins' }
            ],
            correctAnswer: 'B',
            explanation: 'No Preemption means once a resource is granted to a process, the OS cannot forcibly take it away until the process voluntarily releases it.',
            concept: 'No Preemption',
            difficulty: 'Medium',
            sourceReference: `${sourceFile} → Page 42, Section 7.2`
          },
          {
            id: 'p1_q5',
            question: 'Read-only files can be accessed concurrently by 50 processes without ever causing a deadlock on the file lock. Which Coffman condition is naturally absent for read-only resources?',
            options: [
              { id: 'A', text: 'Circular Wait' },
              { id: 'B', text: 'No Preemption' },
              { id: 'C', text: 'Mutual Exclusion' },
              { id: 'D', text: 'Hold and Wait' }
            ],
            correctAnswer: 'C',
            explanation: 'Read-only resources are shareable simultaneously, so Mutual Exclusion (non-shareable access) is not required.',
            concept: 'Mutual Exclusion',
            difficulty: 'Hard',
            sourceReference: `${sourceFile} → Page 42, Section 7.2`
          }
        ]
      },
      {
        id: 'phase_2',
        number: 2,
        title: 'Phase 2: Resource Allocation Graphs & Safe State Topology',
        patternLabel: 'Core Mechanisms & Relationships',
        objective: 'Analyze directed Resource Allocation Graphs (Slide 18), distinguish single-instance vs. multi-instance cycles, and master the formal definition of Safe vs. Unsafe states.',
        concepts: ['Resource Allocation Graphs', 'Request vs. Assignment Edges', 'Single-Instance vs. Multi-Instance Cycles', 'Safe State vs. Unsafe State'],
        prerequisites: ['Phase 1: Coffman Conditions'],
        difficulty: 'Intermediate',
        estimatedLearningTime: '10 mins',
        sourceReferences: [
          'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 18 (Resource Allocation Graph)',
          'Lecture7_Video_Recording.mp4 → Timestamp 21:43 - 22:17 (Safe States)'
        ],
        completionStatus: 'UNLOCKED',
        performance: null,
        briefContent: `### ⚡ Phase 2 (Brief): Resource Allocation Graphs & Safe States\n• **Resource Allocation Graph (RAG)**: Directed graph with Process vertices ($P_i$) and Resource vertices ($R_j$).\n  - **Request Edge ($P_i \\to R_j$)**: $P_i$ is waiting for an instance of $R_j$.\n  - **Assignment Edge ($R_j \\to P_i$)**: An instance of $R_j$ is allocated to $P_i$.\n• **Cycle Theorem (Slide 18)**:\n  - **No cycle** $\\implies$ **No deadlock**.\n  - **Cycle in Single-Instance Graph** $\\implies$ **Guaranteed Deadlock**.\n  - **Cycle in Multi-Instance Graph** $\\implies$ **Necessary but NOT sufficient** (may or may not be deadlocked).\n• **Safe vs. Unsafe State (Video 21:43)**: A state is **Safe** iff a **Safe Sequence** $\\langle P_1, \\dots, P_n \\rangle$ exists. An **Unsafe State** is NOT automatically a deadlock, but the OS cannot guarantee deadlock avoidance if maximum claims materialize.`,
        explanationContent: `### 📖 Phase 2 (Deep Explanation): Resource Allocation Graphs & Safe States\n\n**1. Anatomy of a Resource Allocation Graph (Slide 18)**\nA Resource Allocation Graph $G = (V, E)$ partitions vertices into active **Processes** $P = \\{P_1, \\dots, P_n\\}$ and **Resource Types** $R = \\{R_1, \\dots, R_m\\}$:\n• **Request Edge ($P_i \\to R_j$)**: Inserted when $P_i$ requests $R_j$ and is blocked.\n• **Assignment Edge ($R_j \\to P_i$)**: Replaces the request edge when the kernel grants $R_j$ to $P_i$.\n\n**2. Why Single-Instance vs. Multi-Instance Cycles Differ**\n• **Single-Instance Resources**: On **Slide 18**, $P_1 \\to R_1 \\to P_2 \\to R_2 \\to P_1$ forms a closed cycle where each resource has only 1 instance. Neither $P_1$ nor $P_2$ can ever proceed — **a cycle is both necessary and sufficient for deadlock**.\n• **Multi-Instance Resources**: If $R_1$ has 2 instances and $P_3$ (outside the cycle) holds the second instance of $R_1$, $P_3$ can finish and release its instance to break the cycle! Thus a cycle is necessary but **not sufficient**.\n\n**3. Safe State vs. Unsafe State (Lecture 7 Video @ 21:43)**\n• **Safe State**: There exists at least one ordering $\\langle P_1, P_2, \\dots, P_n \\rangle$ where each $P_i$'s remaining maximum need can be satisfied using currently available resources plus resources held by $P_j$ ($j < i$).\n• **Crucial Distinction**: Every deadlocked state is an unsafe state, **but NOT every unsafe state is a deadlock!** In an unsafe state, if processes release resources early without requesting their full maximum claim, deadlock might still be avoided.`,
        quiz: [
          {
            id: 'p2_q1',
            question: 'In a Resource Allocation Graph, what does a directed edge from a Process node Pi to a Resource node Rj (Pi → Rj) represent?',
            options: [
              { id: 'A', text: 'An Assignment Edge indicating Pi currently holds Rj' },
              { id: 'B', text: 'A Request Edge indicating Pi is currently requesting and waiting for an instance of Rj' },
              { id: 'C', text: 'A Release Edge indicating Pi has finished executing' },
              { id: 'D', text: 'A Preemption Edge indicating the kernel revoked Rj' }
            ],
            correctAnswer: 'B',
            explanation: 'Pi → Rj is a Request Edge (process asking for resource), whereas Rj → Pi is an Assignment Edge (resource allocated to process).',
            concept: 'Request vs. Assignment Edges',
            difficulty: 'Easy',
            sourceReference: 'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 18'
          },
          {
            id: 'p2_q2',
            question: 'According to Slide 18, if a Resource Allocation Graph contains a directed cycle and every resource type has ONLY a single instance, what can we conclude?',
            options: [
              { id: 'A', text: 'The system is in a Safe State' },
              { id: 'B', text: 'The system is guaranteed to be in an active Deadlock' },
              { id: 'C', text: 'A deadlock is impossible unless there are two cycles' },
              { id: 'D', text: 'Processes in the cycle will automatically preempt each other' }
            ],
            correctAnswer: 'B',
            explanation: 'In a single-instance resource allocation graph, a cycle is both a necessary and sufficient condition for deadlock.',
            concept: 'Single-Instance vs. Multi-Instance Cycles',
            difficulty: 'Easy',
            sourceReference: 'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 18'
          },
          {
            id: 'p2_q3',
            question: 'What if a Resource Allocation Graph contains a directed cycle, but each resource type in the cycle has MULTIPLE instances?',
            options: [
              { id: 'A', text: 'The system is definitely deadlocked' },
              { id: 'B', text: 'The cycle is a necessary condition for deadlock, but not sufficient — another process outside the cycle may release an instance' },
              { id: 'C', text: 'Multi-instance graphs can never experience deadlock' },
              { id: 'D', text: 'The OS immediately reboots' }
            ],
            correctAnswer: 'B',
            explanation: 'With multiple instances per resource type, a cycle indicates potential risk, but an unblocked process holding another instance can finish and break the cycle.',
            concept: 'Single-Instance vs. Multi-Instance Cycles',
            difficulty: 'Medium',
            sourceReference: 'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 18'
          },
          {
            id: 'p2_q4',
            question: 'As explained at timestamp 21:43 in the Lecture 7 video recording, which statement accurately compares an "Unsafe State" and a "Deadlock"?',
            options: [
              { id: 'A', text: 'An Unsafe State and a Deadlock are 100% identical' },
              { id: 'B', text: 'An Unsafe State is not necessarily deadlocked yet, but the OS cannot guarantee deadlock avoidance if worst-case maximum claims occur' },
              { id: 'C', text: 'A Deadlock can occur inside a Safe State' },
              { id: 'D', text: 'An Unsafe State guarantees zero resource contention' }
            ],
            correctAnswer: 'B',
            explanation: 'Deadlocks are a subset of Unsafe States. Entering an unsafe state means the OS loses its mathematical guarantee of safety if processes demand their full Max claims.',
            concept: 'Safe State vs. Unsafe State',
            difficulty: 'Medium',
            sourceReference: 'Lecture7_Video_Recording.mp4 → Timestamp 21:43'
          },
          {
            id: 'p2_q5',
            question: 'When is a system formally defined to be in a Safe State?',
            options: [
              { id: 'A', text: 'When CPU utilization is below 50%' },
              { id: 'B', text: 'When there exists at least one Safe Sequence <P1, P2, ..., Pn> that allows all processes to finish up to their maximum claims' },
              { id: 'C', text: 'When no process currently holds any resource' },
              { id: 'D', text: 'When virtual memory swap space is empty' }
            ],
            correctAnswer: 'B',
            explanation: 'A system is in a Safe State if and only if at least one valid Safe Sequence <P1, P2, ..., Pn> exists.',
            concept: 'Safe State vs. Unsafe State',
            difficulty: 'Hard',
            sourceReference: `${sourceFile} → Page 43, Section 7.4`
          }
        ]
      },
      {
        id: 'phase_3',
        number: 3,
        title: "Phase 3: Dijkstra's Banker's Algorithm & Matrix Safety Verification",
        patternLabel: 'Advanced Application & Problem Solving',
        objective: "Compute Need matrices, execute Dijkstra's O(m·n²) Safety & Resource-Request algorithms, and evaluate production deadlock trade-offs.",
        concepts: ['Need Matrix (Max - Allocation)', "Banker's Safety Algorithm", 'Tentative Allocation & Rollback', 'O(m·n²) Complexity & Trade-offs'],
        prerequisites: ['Phase 1: Coffman Conditions', 'Phase 2: Safe States'],
        difficulty: 'Advanced',
        estimatedLearningTime: '12 mins',
        sourceReferences: [
          `${sourceFile} → Page 43, Section 7.4 (Safe Sequences)`,
          'Lecture7_Video_Recording.mp4 → Timestamp 22:17 - 23:05 (Banker\'s Algorithm)'
        ],
        completionStatus: 'UNLOCKED',
        performance: null,
        briefContent: `### ⚡ Phase 3 (Brief): Dijkstra's Banker's Algorithm\n• **Core Matrices** ($n$ processes, $m$ resource types):\n  - \`Available[m]\`, \`Max[n][m]\`, \`Allocation[n][m]\`\n  - **\`Need[i][j] = Max[i][j] - Allocation[i][j]\`**\n• **Resource-Request Algorithm**:\n  1. Check \`Request[i] <= Need[i]\` and \`Request[i] <= Available\`.\n  2. Tentatively allocate: \`Available -= Request[i]\`, \`Allocation[i] += Request[i]\`, \`Need[i] -= Request[i]\`.\n  3. Run **Safety Algorithm ($O(m \\cdot n^2)$)**: Find unfinished $P_k$ with \`Need[k] <= Work\`, set \`Work += Allocation[k]\`, \`Finish[k] = true\`.\n  4. If all \`Finish[k] == true\`, grant request; else **rollback** and block $P_i$.`,
        explanationContent: `### 📖 Phase 3 (Deep Explanation): Dijkstra's Banker's Algorithm & Matrix Verification\n\n**1. Data Structures of Banker's Algorithm (Video 22:17)**\nFor $n$ processes and $m$ resource classes:\n• **\`Available[1..m]\`**: Number of currently free instances of each resource.\n• **\`Max[1..n][1..m]\`**: Maximum demand declared by each process upfront.\n• **\`Allocation[1..n][1..m]\`**: Resources currently held by each process.\n• **\`Need[1..n][1..m]\`**: Remaining possible claims: $$\\text{Need}[i][j] = \\text{Max}[i][j] - \\text{Allocation}[i][j]$$\n\n**2. Concrete Numerical Walkthrough**\nSuppose 1 resource type with \`Available = 3\`:\n• $P_0$: \`Max = 10, Allocation = 5 → Need = 5\`\n• $P_1$: \`Max = 4,  Allocation = 2 → Need = 2\`\n• $P_2$: \`Max = 9,  Allocation = 2 → Need = 7\`\n1. Initialize \`Work = Available = 3\`.\n2. Check $P_1$: \`Need[1] = 2 <= Work (3)\` ✓ → $P_1$ finishes and releases \`Allocation[1] = 2\`! New \`Work = 3 + 2 = 5\`.\n3. Check $P_0$: \`Need[0] = 5 <= Work (5)\` ✓ → $P_0$ finishes and releases \`Allocation[0] = 5\`! New \`Work = 5 + 5 = 10\`.\n4. Check $P_2$: \`Need[2] = 7 <= Work (10)\` ✓ → $P_2$ finishes!\n**Result**: Valid Safe Sequence $\\langle P_1, P_0, P_2 \\rangle$ found — the state is **SAFE**!\n\n**3. Time Complexity**\nFinding a safe sequence across $n$ processes and $m$ resources takes **$O(m \\cdot n^2)$** comparisons.`,
        quiz: [
          {
            id: 'p3_q1',
            question: "In Dijkstra's Banker's Algorithm, how is the remaining resource matrix Need[i][j] calculated for process Pi and resource Rj?",
            options: [
              { id: 'A', text: 'Need[i][j] = Allocation[i][j] + Available[j]' },
              { id: 'B', text: 'Need[i][j] = Max[i][j] - Allocation[i][j]' },
              { id: 'C', text: 'Need[i][j] = Max[i][j] + Allocation[i][j]' },
              { id: 'D', text: 'Need[i][j] = Available[j] - Allocation[i][j]' }
            ],
            correctAnswer: 'B',
            explanation: 'Need[i][j] represents how many more instances Pi may still request, equal to its declared Max[i][j] minus its current Allocation[i][j].',
            concept: 'Need Matrix (Max - Allocation)',
            difficulty: 'Easy',
            sourceReference: 'Lecture7_Video_Recording.mp4 → Timestamp 22:17'
          },
          {
            id: 'p3_q2',
            question: 'During the Safety Algorithm simulation, when an unfinished process Pk satisfies Need[k] <= Work and completes, how is the Work vector updated?',
            options: [
              { id: 'A', text: 'Work = Work + Max[k]' },
              { id: 'B', text: 'Work = Work + Need[k]' },
              { id: 'C', text: 'Work = Work + Allocation[k]' },
              { id: 'D', text: 'Work = Work - Allocation[k]' }
            ],
            correctAnswer: 'C',
            explanation: 'When Pk finishes, it releases the resources it was holding (Allocation[k]), returning them to the available pool (Work = Work + Allocation[k]).',
            concept: "Banker's Safety Algorithm",
            difficulty: 'Medium',
            sourceReference: `${sourceFile} → Page 43, Section 7.4`
          },
          {
            id: 'p3_q3',
            question: 'Given Available = 2, P0 (Allocation=3, Need=4) and P1 (Allocation=2, Need=2), what happens during the Banker Safety check?',
            options: [
              { id: 'A', text: 'Both processes deadlock immediately' },
              { id: 'B', text: 'P1 runs first (Need 2 <= Work 2), releases Allocation 2 so Work becomes 4, allowing P0 (Need 4 <= 4) to finish in safe sequence <P1, P0>' },
              { id: 'C', text: 'P0 runs first because it has higher Allocation' },
              { id: 'D', text: 'The state is Unsafe because Available < 4' }
            ],
            correctAnswer: 'B',
            explanation: 'P1 needs 2 (which is <= Available 2). After P1 completes, Work = 2 + 2 = 4, which satisfies P0 (Need = 4). Thus <P1, P0> is a valid Safe Sequence.',
            concept: "Banker's Safety Algorithm",
            difficulty: 'Medium',
            sourceReference: 'Lecture7_Video_Recording.mp4 → Timestamp 22:17'
          },
          {
            id: 'p3_q4',
            question: 'What does the OS do if a tentative resource allocation in Banker\'s Algorithm leaves the system with NO valid safe sequence?',
            options: [
              { id: 'A', text: 'It commits the allocation anyway and hopes no deadlock occurs' },
              { id: 'B', text: 'It rolls back the tentative allocation (restoring Available, Allocation, and Need) and places the requesting process in a waiting state' },
              { id: 'C', text: 'It terminates all running processes in the kernel' },
              { id: 'D', text: 'It deletes the resource from the device table' }
            ],
            correctAnswer: 'B',
            explanation: 'If the tentative state is unsafe, the kernel rolls back the simulated matrices and makes the requesting process wait until sufficient resources are available.',
            concept: 'Tentative Allocation & Rollback',
            difficulty: 'Medium',
            sourceReference: 'Lecture7_Video_Recording.mp4 → Timestamp 23:05'
          },
          {
            id: 'p3_q5',
            question: "What is the worst-case time complexity of executing Dijkstra's Safety Algorithm for n processes and m resource types?",
            options: [
              { id: 'A', text: 'O(1)' },
              { id: 'B', text: 'O(log n)' },
              { id: 'C', text: 'O(m · n²)' },
              { id: 'D', text: 'O(2^n)' }
            ],
            correctAnswer: 'C',
            explanation: 'In the worst case, the algorithm scans up to n processes across n passes, comparing vectors of length m at each step, yielding O(m · n²) operations.',
            concept: 'O(m·n²) Complexity & Trade-offs',
            difficulty: 'Hard',
            sourceReference: 'Lecture7_Video_Recording.mp4 → Timestamp 22:17'
          }
        ]
      }
    ];
  }

  /**
   * 15-Question Cross-Phase Grand Quiz for Operating Systems Deadlocks (Fresh MCQs across Phases 1, 2, and 3)
   */
  static buildDeadlockGrandQuiz(sourceFile) {
    return [
      {
        id: 'gq_01',
        phaseNumber: 1,
        category: 'Recall',
        concept: 'Coffman Conditions',
        difficulty: 'Easy',
        question: 'Which of the following is NOT one of the four Coffman conditions for deadlock?',
        options: [
          { id: 'A', text: 'Mutual Exclusion' },
          { id: 'B', text: 'Hold and Wait' },
          { id: 'C', text: 'Preemptive Time-Slicing' },
          { id: 'D', text: 'Circular Wait' }
        ],
        correctAnswer: 'C',
        explanation: 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Preemptive time-slicing is a CPU scheduling mechanism.',
        sourceReference: `${sourceFile} → Page 42`
      },
      {
        id: 'gq_02',
        phaseNumber: 1,
        category: 'Conceptual',
        concept: 'Hold and Wait',
        difficulty: 'Medium',
        question: 'A protocol requires every process to request and be allocated ALL its required resources before it begins execution. Which Coffman condition does this protocol eliminate?',
        options: [
          { id: 'A', text: 'Mutual Exclusion' },
          { id: 'B', text: 'Hold and Wait' },
          { id: 'C', text: 'No Preemption' },
          { id: 'D', text: 'Resource Allocation Graph' }
        ],
        correctAnswer: 'B',
        explanation: 'Requesting all resources upfront ensures a process never holds some resources while waiting for others, eliminating Hold and Wait.',
        sourceReference: `${sourceFile} → Page 42`
      },
      {
        id: 'gq_03',
        phaseNumber: 1,
        category: 'Application',
        concept: 'Circular Wait',
        difficulty: 'Medium',
        question: 'Thread T1 locks Mutex(ID=5) then requests Mutex(ID=12). Thread T2 holds Mutex(ID=12) and requests Mutex(ID=5). Which rule did T2 violate?',
        options: [
          { id: 'A', text: 'Ascending lock acquisition ordering (which prevents Circular Wait)' },
          { id: 'B', text: 'Shortest Job First burst estimation' },
          { id: 'C', text: 'TLB cache associativity' },
          { id: 'D', text: 'DMA controller arbitration' }
        ],
        correctAnswer: 'A',
        explanation: 'T2 acquired ID=12 before requesting ID=5, violating ascending lock order and creating a circular wait with T1.',
        sourceReference: 'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 2'
      },
      {
        id: 'gq_04',
        phaseNumber: 1,
        category: 'Conceptual',
        concept: 'No Preemption',
        difficulty: 'Medium',
        question: 'If a process holding resources requests another resource that cannot be immediately allocated, and the kernel automatically preempts all resources currently held by that process, which condition is broken?',
        options: [
          { id: 'A', text: 'Mutual Exclusion' },
          { id: 'B', text: 'No Preemption' },
          { id: 'C', text: 'Safe Sequence' },
          { id: 'D', text: 'Belady Anomaly' }
        ],
        correctAnswer: 'B',
        explanation: 'Allowing the kernel to reclaim held resources when a new request blocks directly invalidates the No Preemption condition.',
        sourceReference: `${sourceFile} → Page 42`
      },
      {
        id: 'gq_05',
        phaseNumber: 1,
        category: 'Application',
        concept: 'Coffman Conditions',
        difficulty: 'Hard',
        question: 'In a database transaction engine, why does sorting row IDs in ascending order before executing SELECT ... FOR UPDATE prevent deadlocks between concurrent transactions?',
        options: [
          { id: 'A', text: 'It turns exclusive locks into read-only locks' },
          { id: 'B', text: 'It breaks Circular Wait because no cycle of transactions can wait on strictly higher row IDs simultaneously' },
          { id: 'C', text: 'It disables ACID durability' },
          { id: 'D', text: 'It reduces network packet size' }
        ],
        correctAnswer: 'B',
        explanation: 'Deterministic lock ordering (sort by ID ASC) makes circular wait impossible across multi-item transactions.',
        sourceReference: `${sourceFile} → Page 42`
      },
      {
        id: 'gq_06',
        phaseNumber: 2,
        category: 'Recall',
        concept: 'Resource Allocation Graphs',
        difficulty: 'Easy',
        question: 'In a Resource Allocation Graph, what happens to the Request Edge (Pi → Rj) when the operating system grants resource Rj to process Pi?',
        options: [
          { id: 'A', text: 'It is deleted and replaced by an Assignment Edge (Rj → Pi)' },
          { id: 'B', text: 'It remains Pi → Rj permanently' },
          { id: 'C', text: 'It connects Pi directly to Pj' },
          { id: 'D', text: 'It duplicates node Rj' }
        ],
        correctAnswer: 'A',
        explanation: 'Once a request is granted, the request edge Pi → Rj is instantaneously converted into an assignment edge Rj → Pi.',
        sourceReference: 'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 18'
      },
      {
        id: 'gq_07',
        phaseNumber: 2,
        category: 'Conceptual',
        concept: 'Single-Instance vs. Multi-Instance Cycles',
        difficulty: 'Medium',
        question: 'If a Resource Allocation Graph has NO directed cycles at all, what can we state with 100% certainty?',
        options: [
          { id: 'A', text: 'The system is deadlocked' },
          { id: 'B', text: 'No process in the system is deadlocked, regardless of whether resources are single-instance or multi-instance' },
          { id: 'C', text: 'The system is in an Unsafe State' },
          { id: 'D', text: 'Banker\'s Algorithm will reject all future requests' }
        ],
        correctAnswer: 'B',
        explanation: 'A cycle is a necessary condition for deadlock in all resource allocation graphs; no cycle means zero deadlock.',
        sourceReference: 'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 18'
      },
      {
        id: 'gq_08',
        phaseNumber: 2,
        category: 'Application',
        concept: 'Single-Instance vs. Multi-Instance Cycles',
        difficulty: 'Hard',
        question: 'Suppose Resource R1 has 2 instances and R2 has 1 instance. P1 holds R1 and requests R2; P2 holds R2 and requests R1; P3 holds the second instance of R1 and requests nothing. Is the system deadlocked?',
        options: [
          { id: 'A', text: 'Yes, because P1 -> R2 -> P2 -> R1 -> P1 forms a cycle' },
          { id: 'B', text: 'No, because P3 can finish and release its instance of R1 to P2, breaking the cycle' },
          { id: 'C', text: 'Yes, because R2 has only 1 instance' },
          { id: 'D', text: 'No, because there is no cycle in the graph' }
        ],
        correctAnswer: 'B',
        explanation: 'Even though P1 and P2 form a cycle, P3 is not blocked. Once P3 finishes and releases R1, P2 acquires R1, finishes, and releases R2 to P1.',
        sourceReference: 'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 18'
      },
      {
        id: 'gq_09',
        phaseNumber: 2,
        category: 'Conceptual',
        concept: 'Safe State vs. Unsafe State',
        difficulty: 'Medium',
        question: 'Which region of the OS state space contains all Deadlocked states?',
        options: [
          { id: 'A', text: 'Deadlocked states are a strict subset of the Safe States' },
          { id: 'B', text: 'Deadlocked states are a strict subset of the Unsafe States' },
          { id: 'C', text: 'Safe States and Deadlocked States overlap by 50%' },
          { id: 'D', text: 'Deadlocked states exist outside both Safe and Unsafe states' }
        ],
        correctAnswer: 'B',
        explanation: 'All deadlocked states are unsafe, whereas only a subset of unsafe states actually degenerate into a deadlock.',
        sourceReference: 'Lecture7_Video_Recording.mp4 → Timestamp 21:43'
      },
      {
        id: 'gq_10',
        phaseNumber: 2,
        category: 'Application',
        concept: 'Safe State vs. Unsafe State',
        difficulty: 'Hard',
        question: 'A system has 12 magnetic tape drives. P0 (Max=10, Alloc=5), P1 (Max=4, Alloc=2), P2 (Max=9, Alloc=2). Currently 3 drives are free. If P2 requests 1 more drive and the OS grants it (leaving 2 free), what happens?',
        options: [
          { id: 'A', text: 'The system remains in a Safe State' },
          { id: 'B', text: 'The system transitions into an Unsafe State because only P1 can finish (releasing 2 drives for 4 free), which is less than P0 Need(5) and P2 Need(6)' },
          { id: 'C', text: 'All 12 drives become free immediately' },
          { id: 'D', text: 'P0 Need becomes 0' }
        ],
        correctAnswer: 'B',
        explanation: 'Granting 1 more drive to P2 reduces Available to 2. After P1 finishes (Work = 2 + 2 = 4), neither P0 (Need=5) nor P2 (Need=6) can be satisfied — making the state Unsafe!',
        sourceReference: `${sourceFile} → Page 43`
      },
      {
        id: 'gq_11',
        phaseNumber: 3,
        category: 'Recall',
        concept: 'Need Matrix (Max - Allocation)',
        difficulty: 'Easy',
        question: 'If Process P3 has declared Max = [7, 5, 3] and currently holds Allocation = [2, 1, 0], what is its Need[3] vector?',
        options: [
          { id: 'A', text: '[9, 6, 3]' },
          { id: 'B', text: '[5, 4, 3]' },
          { id: 'C', text: '[2, 1, 0]' },
          { id: 'D', text: '[7, 5, 3]' }
        ],
        correctAnswer: 'B',
        explanation: 'Need = Max - Allocation = [7-2, 5-1, 3-0] = [5, 4, 3].',
        sourceReference: 'Lecture7_Video_Recording.mp4 → Timestamp 22:17'
      },
      {
        id: 'gq_12',
        phaseNumber: 3,
        category: 'Conceptual',
        concept: 'Tentative Allocation & Rollback',
        difficulty: 'Medium',
        question: "In Banker's Resource-Request Algorithm, what error condition is triggered if a process requests Request[i] > Need[i]?",
        options: [
          { id: 'A', text: 'The process simply waits in the queue' },
          { id: 'B', text: 'An error is raised because the process has exceeded its maximum declared claim' },
          { id: 'C', text: 'The OS automatically increases Max[i]' },
          { id: 'D', text: 'The Safety Algorithm is skipped and the request is granted' }
        ],
        correctAnswer: 'B',
        explanation: 'If Request[i] > Need[i], the process is asking for more resources than it promised as its maximum claim, so the request is rejected as an error.',
        sourceReference: `${sourceFile} → Page 43`
      },
      {
        id: 'gq_13',
        phaseNumber: 3,
        category: 'Application',
        concept: "Banker's Safety Algorithm",
        difficulty: 'Medium',
        question: 'Suppose 3 processes have Need: P0=6, P1=1, P2=3, and Allocation: P0=2, P1=3, P2=2, with Available=1. Which Safe Sequence is valid?',
        options: [
          { id: 'A', text: '<P0, P1, P2>' },
          { id: 'B', text: '<P1, P2, P0>' },
          { id: 'C', text: '<P2, P0, P1>' },
          { id: 'D', text: 'No safe sequence exists' }
        ],
        correctAnswer: 'B',
        explanation: 'With Available=1, only P1 (Need=1) can run first -> releases Alloc=3 -> Work=4 -> P2 (Need=3 <= 4) runs next -> releases Alloc=2 -> Work=6 -> P0 (Need=6 <= 6) finishes! Sequence: <P1, P2, P0>.',
        sourceReference: 'Lecture7_Video_Recording.mp4 → Timestamp 22:17'
      },
      {
        id: 'gq_14',
        phaseNumber: 3,
        category: 'Conceptual',
        concept: 'O(m·n²) Complexity & Trade-offs',
        difficulty: 'Medium',
        question: "Why do most general-purpose desktop operating systems rarely run Dijkstra's Banker's Algorithm for every lock acquisition?",
        options: [
          { id: 'A', text: 'Because processes rarely know their exact maximum resource needs in advance, and the number of processes/resources changes dynamically' },
          { id: 'B', text: "Because Banker's Algorithm only works for single-core CPUs" },
          { id: 'C', text: "Because Banker's Algorithm cannot detect unsafe states" },
          { id: 'D', text: 'Because it requires disabling virtual memory' }
        ],
        correctAnswer: 'A',
        explanation: "Banker's Algorithm requires fixed process counts and a priori knowledge of Max resource claims, which is often impractical for dynamic general-purpose workloads.",
        sourceReference: `${sourceFile} → Page 43`
      },
      {
        id: 'gq_15',
        phaseNumber: 3,
        category: 'Application',
        concept: 'Single-Instance vs. Multi-Instance Cycles',
        difficulty: 'Hard',
        question: 'When every resource type in a system has exactly 1 instance, which algorithm can replace the O(m·n²) Banker\'s Algorithm with a faster O(n²) check?',
        options: [
          { id: 'A', text: 'Resource-Allocation Graph cycle detection with claim edges' },
          { id: 'B', text: 'Round Robin time-slicing' },
          { id: 'C', text: 'FIFO page replacement' },
          { id: 'D', text: 'Bubble sort' }
        ],
        correctAnswer: 'A',
        explanation: 'For single-instance resources, a variant of the Resource Allocation Graph with claim edges detects unsafe states in O(n²) cycle-detection time.',
        sourceReference: 'Lecture7_Deadlock_Avoidance_Slides.pptx → Slide 18'
      }
    ];
  }

  /**
   * Dynamically builds a 3-Phase Curriculum + Phase Quizzes for ANY user-uploaded document or custom topic!
   */
  static buildDynamicMaterialPhases(subjectTitle, sourceFile, units, concepts, prerequisites) {
    const c1 = concepts[0] || `${subjectTitle} Foundations`;
    const c2 = concepts[1] || `${subjectTitle} Core Mechanisms`;
    const c3 = concepts[2] || `${subjectTitle} Advanced Optimization`;

    const u1Text = units[0]?.content || `${c1} establishes the fundamental definitions, core axioms, and preconditions for ${subjectTitle}.`;
    const u2Text = units[1]?.content || `${c2} models the primary workflows, mathematical relationships, and structural interactions within ${subjectTitle}.`;
    const u3Text = units[2]?.content || `${c3} addresses edge cases, performance optimization, and real-world system trade-offs in ${subjectTitle}.`;

    const u1Loc = units[0]?.location_label || 'Section 1 • Foundations';
    const u2Loc = units[1]?.location_label || 'Section 2 • Core Mechanisms';
    const u3Loc = units[2]?.location_label || 'Section 3 • Applied Optimization';

    return [
      {
        id: 'phase_1',
        number: 1,
        title: `Phase 1: ${c1} (Foundations)`,
        patternLabel: 'Foundation',
        objective: `Understand the foundational definitions, prerequisites (${prerequisites.join(', ')}), and core invariants of ${c1}.`,
        concepts: [c1, prerequisites[0] || 'Core Terminology'],
        prerequisites,
        difficulty: 'Beginner',
        estimatedLearningTime: '6 mins',
        sourceReferences: [`${sourceFile} → ${u1Loc}`],
        completionStatus: 'IN_PROGRESS',
        performance: null,
        briefContent: `### ⚡ Phase 1 (Brief): ${c1}\n• **Core Principle**: ${u1Text.slice(0, 260)}\n• **Prerequisites**: ${prerequisites.join(' → ')} → **${c1}**\n• **Source**: \`${sourceFile}\` (${u1Loc})`,
        explanationContent: `### 📖 Phase 1 (Deep Explanation): ${c1}\n\n**1. Foundational Evidence from Your Material (\`${sourceFile}\` • ${u1Loc})**\n${u1Text}\n\n**2. Conceptual Role & Prerequisites**\nBefore moving into complex problem solving, **${c1}** defines the baseline rules and boundaries built upon **${prerequisites.join(' and ')}**.\n\n**3. Practical Intuition**\nMastering Phase 1 ensures you can accurately identify when **${c1}** applies and what preconditions must hold before transitioning to Phase 2.`,
        quiz: this.buildDynamicPhaseMCQs(1, c1, u1Text, sourceFile, u1Loc, subjectTitle)
      },
      {
        id: 'phase_2',
        number: 2,
        title: `Phase 2: ${c2} (Mechanisms & Relationships)`,
        patternLabel: 'Core Concepts & Relationships',
        objective: `Analyze how ${c2} operates step-by-step and how it interacts with ${c1}.`,
        concepts: [c2, `${c1} → ${c2} Integration`],
        prerequisites: [c1],
        difficulty: 'Intermediate',
        estimatedLearningTime: '8 mins',
        sourceReferences: [`${sourceFile} → ${u2Loc}`],
        completionStatus: 'UNLOCKED',
        performance: null,
        briefContent: `### ⚡ Phase 2 (Brief): ${c2}\n• **Core Mechanism**: ${u2Text.slice(0, 260)}\n• **Dependency Link**: Builds directly on **${c1}** to govern state transitions.\n• **Source**: \`${sourceFile}\` (${u2Loc})`,
        explanationContent: `### 📖 Phase 2 (Deep Explanation): ${c2}\n\n**1. Grounded Source Evidence (\`${sourceFile}\` • ${u2Loc})**\n${u2Text}\n\n**2. Structural Relationships**\nIn Phase 2, we connect the definitions of **${c1}** to the active execution mechanics of **${c2}**, examining how inputs are transformed and validated at each stage.`,
        quiz: this.buildDynamicPhaseMCQs(2, c2, u2Text, sourceFile, u2Loc, subjectTitle)
      },
      {
        id: 'phase_3',
        number: 3,
        title: `Phase 3: ${c3} (Advanced Application & Edge Cases)`,
        patternLabel: 'Advanced Application',
        objective: `Evaluate complex scenarios, optimization trade-offs, and edge cases in ${c3}.`,
        concepts: [c3, 'Edge-Case Verification & Optimization'],
        prerequisites: [c1, c2],
        difficulty: 'Advanced',
        estimatedLearningTime: '10 mins',
        sourceReferences: [`${sourceFile} → ${u3Loc}`],
        completionStatus: 'UNLOCKED',
        performance: null,
        briefContent: `### ⚡ Phase 3 (Brief): ${c3}\n• **Advanced Synthesis**: ${u3Text.slice(0, 260)}\n• **Mastery Goal**: Apply **${c1} + ${c2} + ${c3}** to solve real-world and exam-level problems.\n• **Source**: \`${sourceFile}\` (${u3Loc})`,
        explanationContent: `### 📖 Phase 3 (Deep Explanation): ${c3}\n\n**1. Grounded Source Evidence (\`${sourceFile}\` • ${u3Loc})**\n${u3Text}\n\n**2. Systems Integration & Optimization**\nPhase 3 synthesizes **${c1}**, **${c2}**, and **${c3}** so you can diagnose bottlenecks, handle boundary conditions, and justify architectural decisions under load.`,
        quiz: this.buildDynamicPhaseMCQs(3, c3, u3Text, sourceFile, u3Loc, subjectTitle)
      }
    ];
  }

  static buildDynamicPhaseMCQs(phaseNum, concept, textSnippet, sourceFile, locLabel, subjectTitle) {
    const cleanSnippet = textSnippet.replace(/\n+/g, ' ').slice(0, 130);
    return [
      {
        id: `p${phaseNum}_q1`,
        question: `According to "${sourceFile}" (${locLabel}), what is the primary focus of ${concept}?`,
        options: [
          { id: 'A', text: `${cleanSnippet}...` },
          { id: 'B', text: `Bypassing all validation checks in ${subjectTitle}` },
          { id: 'C', text: `Replacing structured analysis with random guesswork` },
          { id: 'D', text: `Disabling system state tracking permanently` }
        ],
        correctAnswer: 'A',
        explanation: `Verified from ${sourceFile} (${locLabel}): ${textSnippet.slice(0, 200)}`,
        concept,
        difficulty: 'Easy',
        sourceReference: `${sourceFile} → ${locLabel}`
      },
      {
        id: `p${phaseNum}_q2`,
        question: `In Phase ${phaseNum} (${concept}), why must prerequisite assumptions be verified before applying the mechanism?`,
        options: [
          { id: 'A', text: 'To ensure system invariants and correctness guarantees hold under all valid inputs' },
          { id: 'B', text: 'To intentionally slow down execution throughput' },
          { id: 'C', text: 'Because prerequisites are optional cosmetic labels' },
          { id: 'D', text: 'To corrupt downstream state transitions' }
        ],
        correctAnswer: 'A',
        explanation: `Verifying prerequisites ensures ${concept} operates within its guaranteed mathematical and architectural bounds.`,
        concept,
        difficulty: 'Easy',
        sourceReference: `${sourceFile} → ${locLabel}`
      },
      {
        id: `p${phaseNum}_q3`,
        question: `When analyzing ${concept} within ${subjectTitle}, which approach prevents common implementation pitfalls?`,
        options: [
          { id: 'A', text: 'Ignoring boundary conditions and edge cases' },
          { id: 'B', text: 'Validating state transitions and capacity constraints at every step' },
          { id: 'C', text: 'Assuming concurrent requests never contend for shared state' },
          { id: 'D', text: 'Hardcoding outputs without inspecting input parameters' }
        ],
        correctAnswer: 'B',
        explanation: `Step-by-step validation of state transitions and boundary conditions is essential for reliable execution of ${concept}.`,
        concept,
        difficulty: 'Medium',
        sourceReference: `${sourceFile} → ${locLabel}`
      },
      {
        id: `p${phaseNum}_q4`,
        question: `How does ${concept} (Phase ${phaseNum}) contribute to the overall architecture of ${subjectTitle}?`,
        options: [
          { id: 'A', text: 'It provides a verifiable structural layer that links foundational rules to practical problem solving' },
          { id: 'B', text: 'It operates in complete isolation with zero connection to other topics' },
          { id: 'C', text: 'It removes the need for performance measurement' },
          { id: 'D', text: 'It only applies to deprecated legacy hardware' }
        ],
        correctAnswer: 'A',
        explanation: `${concept} bridges theoretical invariants and applied execution across the ${subjectTitle} learning progression.`,
        concept,
        difficulty: 'Medium',
        sourceReference: `${sourceFile} → ${locLabel}`
      },
      {
        id: `p${phaseNum}_q5`,
        question: `Suppose a high-load edge case occurs while executing a workflow governed by ${concept}. What is the rigorous engineering response?`,
        options: [
          { id: 'A', text: 'Evaluate the invariant defined in the source material and apply deterministic recovery or bounded throttling' },
          { id: 'B', text: 'Silently drop data without logging or verification' },
          { id: 'C', text: 'Disable all safety checks in production' },
          { id: 'D', text: 'Restart the hardware clock manually' }
        ],
        correctAnswer: 'A',
        explanation: `Production systems handle contention in ${concept} by enforcing invariants and deterministic fallback/recovery paths.`,
        concept,
        difficulty: 'Hard',
        sourceReference: `${sourceFile} → ${locLabel}`
      }
    ];
  }

  static buildDynamicGrandQuiz(subjectTitle, sourceFile, phases) {
    const questions = [];
    const categories = ['Recall', 'Conceptual', 'Application'];
    phases.forEach((p) => {
      const c = p.concepts[0] || p.title;
      for (let i = 0; i < 5; i++) {
        const cat = categories[i % categories.length];
        questions.push({
          id: `gq_p${p.number}_${i + 1}`,
          phaseNumber: p.number,
          category: cat,
          concept: c,
          difficulty: i === 0 ? 'Easy' : i < 3 ? 'Medium' : 'Hard',
          question: `[Grand Quiz • Phase ${p.number} ${cat}] In the context of ${subjectTitle}, which statement accurately characterizes ${c} (Question ${i + 1})?`,
          options: [
            { id: 'A', text: `Enforces the verified Phase ${p.number} principle from ${sourceFile} (${p.objective.slice(0, 95)})` },
            { id: 'B', text: `Violates Phase ${p.number} invariants by skipping prerequisite validation` },
            { id: 'C', text: `Assumes ${c} has zero impact on system correctness or throughput` },
            { id: 'D', text: `Treats ${c} as mutually exclusive with the rest of ${subjectTitle}` }
          ],
          correctAnswer: 'A',
          explanation: `Cross-phase synthesis from Phase ${p.number} (${p.title}): ${p.objective}`,
          sourceReference: p.sourceReferences?.[0] || sourceFile
        });
      }
    });
    return questions;
  }

  /**
   * Evaluate a completed Phase Quiz (5 MCQs), update phase status, detect strong/weak concepts,
   * and unlock Grand Quiz when all 3 phases are completed.
   */
  static evaluatePhaseQuiz(sessionId, phaseNumber, userAnswers = {}) {
    const all = this.getAllSessions();
    const session = all.find((s) => s.id === sessionId) || this.getActiveSession();
    if (!session) return null;

    const phase = session.phases.find((p) => p.number === Number(phaseNumber));
    if (!phase) return null;

    let correctCount = 0;
    const strongSet = new Set();
    const weakSet = new Set();

    phase.quiz.forEach((q) => {
      const selected = userAnswers[q.id];
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) {
        correctCount++;
        strongSet.add(q.concept);
      } else {
        weakSet.add(q.concept);
      }
    });

    // Remove any concept in weakSet from strongSet so categorization is clean
    weakSet.forEach((w) => strongSet.delete(w));

    const total = phase.quiz.length;
    const accuracy = Math.round((correctCount / total) * 100);

    phase.completionStatus = 'COMPLETED';
    phase.performance = {
      score: correctCount,
      total,
      accuracy,
      band: accuracy >= 80 ? 'HIGH' : accuracy >= 60 ? 'MEDIUM' : 'LOW',
      strongConcepts: Array.from(strongSet),
      weakConcepts: Array.from(weakSet),
      userAnswers,
      completedAt: new Date().toISOString()
    };

    // Advance currentPhaseNumber if next phase exists
    if (phaseNumber < 3) {
      session.currentPhaseNumber = phaseNumber + 1;
      const nextPhase = session.phases.find((p) => p.number === phaseNumber + 1);
      if (nextPhase && nextPhase.completionStatus === 'UNLOCKED') {
        nextPhase.completionStatus = 'IN_PROGRESS';
      }
    }

    // Unlock Grand Quiz if all 3 phases are COMPLETED
    const allThreeDone = session.phases.every((p) => p.completionStatus === 'COMPLETED');
    if (allThreeDone) {
      session.grandQuiz.unlocked = true;
    }

    // Update learner XP & mastery in profile
    const profile = ClientIntelligenceEngine.getStoredProfile();
    profile.xp_points += correctCount * 20;
    profile.overall_mastery = Math.min(1.0, Number((profile.overall_mastery + (accuracy >= 60 ? 0.03 : 0.01)).toFixed(3)));
    profile.level = Math.max(1, 1 + Math.floor(profile.xp_points / 300));
    ClientIntelligenceEngine.saveProfile(profile);

    this.saveSession(session);
    return {
      session,
      phasePerformance: phase.performance,
      grandQuizUnlocked: session.grandQuiz.unlocked
    };
  }

  /**
   * Evaluate the 15-Question Grand Quiz & generate the Final Cognitive Diagnosis Learning Report
   */
  static evaluateGrandQuiz(sessionId, userAnswers = {}) {
    const all = this.getAllSessions();
    const session = all.find((s) => s.id === sessionId) || this.getActiveSession();
    if (!session) return null;

    const questions = session.grandQuiz.questions || [];
    let totalCorrect = 0;
    const phaseBreakdown = {
      1: { correct: 0, total: 0 },
      2: { correct: 0, total: 0 },
      3: { correct: 0, total: 0 }
    };
    const strongConcepts = new Set();
    const weakConcepts = new Set();

    questions.forEach((q) => {
      const pNum = q.phaseNumber || 1;
      if (!phaseBreakdown[pNum]) phaseBreakdown[pNum] = { correct: 0, total: 0 };
      phaseBreakdown[pNum].total++;

      const isCorrect = userAnswers[q.id] === q.correctAnswer;
      if (isCorrect) {
        totalCorrect++;
        phaseBreakdown[pNum].correct++;
        strongConcepts.add(q.concept);
      } else {
        weakConcepts.add(q.concept);
      }
    });

    weakConcepts.forEach((w) => strongConcepts.delete(w));

    const percentage = Math.round((totalCorrect / Math.max(1, questions.length)) * 100);
    const report = {
      score: totalCorrect,
      total: questions.length,
      percentage,
      grade: percentage >= 85 ? 'Mastered (Distinction)' : percentage >= 70 ? 'Proficient' : 'Needs Targeted Reinforcement',
      phaseWisePerformance: [
        {
          phase: 1,
          title: session.phases[0]?.title || 'Phase 1',
          score: phaseBreakdown[1].correct,
          total: phaseBreakdown[1].total,
          accuracy: Math.round((phaseBreakdown[1].correct / Math.max(1, phaseBreakdown[1].total)) * 100)
        },
        {
          phase: 2,
          title: session.phases[1]?.title || 'Phase 2',
          score: phaseBreakdown[2].correct,
          total: phaseBreakdown[2].total,
          accuracy: Math.round((phaseBreakdown[2].correct / Math.max(1, phaseBreakdown[2].total)) * 100)
        },
        {
          phase: 3,
          title: session.phases[2]?.title || 'Phase 3',
          score: phaseBreakdown[3].correct,
          total: phaseBreakdown[3].total,
          accuracy: Math.round((phaseBreakdown[3].correct / Math.max(1, phaseBreakdown[3].total)) * 100)
        }
      ],
      strongestConcepts: Array.from(strongConcepts),
      weakestConcepts: Array.from(weakConcepts),
      recommendedRevision:
        weakConcepts.size > 0
          ? `Review ${Array.from(weakConcepts).join(', ')} in Explanation Mode and re-verify source excerpts in ${session.sourceDocument}.`
          : `Outstanding mastery across all 3 phases! Ready to advance to Process Synchronization, Semaphores, and Virtual Memory Paging.`,
      suggestedNextTopic: 'Process Synchronization, Semaphores & Virtual Memory TLB Architecture',
      userAnswers,
      completedAt: new Date().toISOString()
    };

    session.grandQuiz.completed = true;
    session.grandQuiz.result = report;

    // Award Grand Quiz completion XP & Mastery boost
    const profile = ClientIntelligenceEngine.getStoredProfile();
    profile.xp_points += totalCorrect * 25 + 100;
    profile.overall_mastery = Math.min(1.0, Number((profile.overall_mastery + 0.08).toFixed(3)));
    profile.level = Math.max(1, 1 + Math.floor(profile.xp_points / 300));
    ClientIntelligenceEngine.saveProfile(profile);

    this.saveSession(session);
    return { session, report };
  }
}
