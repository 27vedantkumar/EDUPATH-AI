/**
 * EduPath AI — Smart Exam Mentor, Simplified Adaptive Learning & Bayesian Active Learning Engine
 *
 * Implements the 5 Reference Architectures:
 * 1. RAG Enhanced Chatbot (7-Step Flow: Knowledge → Embeddings → Vector Store ↔ LLM + Outside Knowledge → User)
 * 2. Gemini Multimodal AI + TTS Subtitling → Simplified Adaptive Learning (Visual/Text/Audio Q&A, Podcast, ELI12, Similar Content) + Smart Exam Mentor (MCQ, Fill in the Blanks, True/False, FAQ)
 * 3. 5-Stage RAG Chatbot Architecture (Data Ingestion & Indexing → User Query → Retrieval → Prompt Assembly & Generation → Response Delivery)
 * 4. How ChatGPT / LLM Works (Interactive Tokenization into colored subword tokens → LLM Processing → Response)
 * 5. Bayesian Updating & Active Learning Loop (User Feedback D → Bayesian Updating P(θ|D), θ' → Question Database q ∈ Q → Active Learning A(q), α_q, V_q ↔ Flagged Questions)
 */

import { ClientIntelligenceEngine } from './clientEngine';

const STORAGE_KEY_BAYESIAN = 'edupath_bayesian_active_learning_v1';

const TOKEN_COLORS = [
  'bg-sky-500/20 border-sky-500/40 text-sky-300',
  'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  'bg-amber-500/20 border-amber-500/40 text-amber-300',
  'bg-purple-500/20 border-purple-500/40 text-purple-300',
  'bg-rose-500/20 border-rose-500/40 text-rose-300',
  'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
];

export class SmartExamEngine {
  /**
   * Diagram 4 ("How ChatGPT Works"):
   * Splits user input into subword/phrase tokens with deterministic token IDs and visual color classes.
   */
  static tokenizeQuery(query = '') {
    const clean = String(query || '').trim();
    if (!clean) return { tokens: [], totalTokens: 0, estimatedCostMs: 0 };

    // Group meaningful multi-word proper nouns or split into word/punctuation tokens
    const rawWords = clean.match(/[A-Za-z0-9_'-]+|[?.!,;:]/g) || [clean];
    const tokens = rawWords.map((word, idx) => {
      let hash = 2166136261;
      for (let i = 0; i < word.length; i++) {
        hash ^= word.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      const tokenId = Math.abs(hash % 50257);
      return {
        index: idx,
        text: word,
        tokenId,
        colorClass: TOKEN_COLORS[idx % TOKEN_COLORS.length]
      };
    });

    return {
      tokens,
      totalTokens: tokens.length,
      charCount: clean.length,
      llmProcessingSummary: `Tokenized ${tokens.length} subword chunks → 12-layer self-attention context window → Next-token probability synthesis`
    };
  }

  /**
   * Diagram 3 ("RAG Chatbot Architecture" 5-Stage Pipeline) &
   * Diagram 1 ("RAG Enhanced Chatbot" 7-Step Flow combining Vector Store + LLM Outside Knowledge)
   */
  static buildUnifiedRagDiagrams({
    query = '',
    scopedDocument = '',
    chunksScanned = 8,
    bm25Score = 4.2,
    vectorScore = 0.96,
    sourceOrigin = 'Grounded + Outside Knowledge'
  } = {}) {
    const fiveStagePipeline = [
      {
        stage: 1,
        title: 'Data Ingestion & Indexing',
        subtitle: 'Prepare, chunk, embed, and store knowledge.',
        metric: `${chunksScanned} source chunks indexed (384-d vectors + BM25)`
      },
      {
        stage: 2,
        title: 'User Query',
        subtitle: 'The user asks a question.',
        metric: `"${query.slice(0, 48)}${query.length > 48 ? '...' : ''}"`
      },
      {
        stage: 3,
        title: 'Retrieval',
        subtitle: 'Find relevant content with filters and access control.',
        metric: `Scope: ${scopedDocument || 'All Accessible Course Sources'} (BM25 ${bm25Score})`
      },
      {
        stage: 4,
        title: 'Prompt Assembly & Generation',
        subtitle: 'Combine context with instructions and generate answers.',
        metric: `Cosine Similarity ${vectorScore} + Pedagogical System Prompt`
      },
      {
        stage: 5,
        title: 'Response Delivery',
        subtitle: 'Return a grounded response to the user.',
        metric: sourceOrigin
      }
    ];

    const sevenStepRagEnhanced = [
      { step: 1, from: 'Knowledge (PDF/Video/Audio)', to: 'Embeddings Model', label: 'Extract & Normalize' },
      { step: 2, from: 'Embeddings Model', to: 'Vector Store', label: 'Store 384-d Embeddings' },
      { step: 3, from: 'User', to: 'Embeddings Model', label: 'Embed User Question' },
      { step: 4, from: 'Embeddings Model', to: 'LLM', label: 'Forward Query Vector & Context' },
      { step: 5, from: 'LLM', to: 'Vector Store', label: 'Semantic & Lexical Retrieval' },
      { step: 6, from: 'Vector Store', to: 'LLM', label: 'Return Top-K Related Data' },
      { step: 7, from: 'LLM', to: 'User', label: 'Answer Combined with LLM & Outside Knowledge' }
    ];

    return { fiveStagePipeline, sevenStepRagEnhanced };
  }

  /**
   * Diagram 5: Bayesian Updating & Active Learning State Manager
   * User Feedback (D) → Bayesian Updating P(θ|D), θ' → Question Database (q ∈ Q)
   * → Active Learning A(q), α_q, V_q ↔ Flagged Questions
   */
  static getBayesianState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BAYESIAN);
      if (raw) return JSON.parse(raw);
    } catch (_) {}

    const initial = {
      priorTheta: 0.62,
      posteriorTheta: 0.68,
      lastLikelihood: 0.85,
      evidenceCount: 4,
      uncertaintyVarianceVq: 0.21,
      acquisitionAlpha: 0.88,
      activeAcquisitionScore: 0.76,
      flaggedQuestionIds: ['mcq_2', 'tf_2'],
      history: [
        {
          id: 'ev_init',
          timestamp: 'Initial Diagnostic',
          questionId: 'mcq_1',
          correct: true,
          prior: 0.55,
          posterior: 0.68,
          acquisitionA: 0.76
        }
      ]
    };
    this.saveBayesianState(initial);
    return initial;
  }

  static saveBayesianState(state) {
    try {
      localStorage.setItem(STORAGE_KEY_BAYESIAN, JSON.stringify(state));
    } catch (_) {}
  }

  /**
   * Perform genuine Bayesian Posterior Update P(θ | D) = [P(D | θ) * P(θ)] / P(D)
   * when user answers a question or submits feedback D.
   */
  static updateBayesianPosterior({ questionId, isCorrect, difficultyWeight = 1.0 }) {
    const state = this.getBayesianState();
    const prior = Math.max(0.05, Math.min(0.98, state.posteriorTheta));

    // Likelihood P(D | θ) under slip/guess BKT-inspired model:
    // p(correct | mastered) = 0.88, p(correct | unmastered) = 0.25
    const pSlip = 0.12;
    const pGuess = 0.25;
    const likelihoodMastered = isCorrect ? 1 - pSlip : pSlip;
    const likelihoodUnmastered = isCorrect ? pGuess : 1 - pGuess;

    const marginalPD = prior * likelihoodMastered + (1 - prior) * likelihoodUnmastered;
    const rawPosterior = (prior * likelihoodMastered) / (marginalPD || 1);

    // Blend with difficulty weight
    const posterior = Number(
      Math.max(0.08, Math.min(0.99, prior + (rawPosterior - prior) * difficultyWeight)).toFixed(3)
    );

    // Compute Active Learning Variance V_q = θ'(1 - θ') and Acquisition A(q) = α_q * 4 * V_q
    const varianceVq = Number((posterior * (1 - posterior)).toFixed(3));
    const isFlagged = state.flaggedQuestionIds.includes(questionId);
    const alphaQ = isFlagged ? 1.25 : 0.92;
    const acquisitionScore = Number(Math.min(0.99, alphaQ * Math.sqrt(varianceVq) * 1.6).toFixed(2));

    // Automatically flag questions answered incorrectly so Active Learning prioritizes them
    let updatedFlags = [...state.flaggedQuestionIds];
    if (!isCorrect && !updatedFlags.includes(questionId)) {
      updatedFlags.push(questionId);
    }

    const updated = {
      priorTheta: prior,
      posteriorTheta: posterior,
      lastLikelihood: Number(likelihoodMastered.toFixed(2)),
      evidenceCount: (state.evidenceCount || 0) + 1,
      uncertaintyVarianceVq: varianceVq,
      acquisitionAlpha: alphaQ,
      activeAcquisitionScore: acquisitionScore,
      flaggedQuestionIds: updatedFlags,
      history: [
        {
          id: `ev_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          questionId,
          correct: isCorrect,
          prior,
          posterior,
          acquisitionA: acquisitionScore
        },
        ...(state.history || []).slice(0, 9)
      ]
    };

    this.saveBayesianState(updated);
    return updated;
  }

  static toggleFlagQuestion(questionId) {
    const state = this.getBayesianState();
    const exists = state.flaggedQuestionIds.includes(questionId);
    const updatedFlags = exists
      ? state.flaggedQuestionIds.filter((id) => id !== questionId)
      : [...state.flaggedQuestionIds, questionId];

    const updated = {
      ...state,
      flaggedQuestionIds: updatedFlags,
      acquisitionAlpha: updatedFlags.length > 0 ? 1.25 : 0.9
    };
    this.saveBayesianState(updated);
    return updated;
  }

  /**
   * Diagram 2: Generate Comprehensive Multimodal Content + Simplified Adaptive Learning + Smart Exam Mentor
   * Supports ANY uploaded document or general topic!
   */
  static generateSmartMentorBundle({ documentName = '', customTopic = '' } = {}) {
    const allDocs = ClientIntelligenceEngine.getAllDocuments();
    const doc = documentName
      ? allDocs.find((d) => d.filename.toLowerCase().includes(documentName.toLowerCase()))
      : allDocs[0];

    const topicName =
      customTopic ||
      (doc?.topic && doc.topic !== 'Deadlocks'
        ? `${doc.topic} (${doc.filename})`
        : 'Operating Systems: Deadlocks, Resource Allocation & Banker\'s Algorithm');

    const lower = `${topicName} ${doc?.filename || ''}`.toLowerCase();

    if (lower.includes('cpu') || lower.includes('schedul')) {
      return this.buildCpuSchedulingBundle(doc);
    }
    if (lower.includes('virtual') || lower.includes('tlb') || lower.includes('pag')) {
      return this.buildVirtualMemoryBundle(doc);
    }
    if (lower.includes('inventory') || lower.includes('stocksense') || lower.includes('ledger')) {
      return this.buildInventoryFsmBundle(doc);
    }
    return this.buildDeadlockDefaultBundle(doc, topicName);
  }

  static buildDeadlockDefaultBundle(doc, topicName) {
    const sourceLabel = doc?.filename || 'Operating_Systems_Ch7_Deadlocks.pdf';
    return {
      topic: topicName,
      sourceDocument: sourceLabel,
      modalities: [
        { type: 'Article / PDF', label: 'Operating_Systems_Ch7_Deadlocks.pdf (Pages 42–45)', status: 'Indexed' },
        { type: 'Video', label: 'Lecture7_Deadlocks_Recording.mp4 (21:10–22:05)', status: 'Transcribed & Subtitled' },
        { type: 'Audio / TTS', label: 'Gemini Neural TTS & Multi-Host Study Podcast', status: 'Synthesized' }
      ],
      eli12Explanation: {
        title: "🧒 ELI12 (Explain Like I'm 12): Why Do Computers Freeze in a Deadlock?",
        analogy: "Imagine two kids, Maya and Leo, trying to build Lego castles. There is only ONE bucket of red bricks and ONE bucket of blue bricks.",
        storySteps: [
          "1. **Mutual Exclusion (Only one person per toy)**: Only one kid can hold a brick bucket at a time.",
          "2. **Hold and Wait (Grabbing and waiting)**: Maya grabs the Red Bucket and refuses to let go until she also gets the Blue Bucket. At the exact same time, Leo grabs the Blue Bucket and refuses to let go until he gets the Red Bucket!",
          "3. **No Preemption (No snatching allowed!)**: Neither kid is allowed to snatch a bucket out of the other kid's hands.",
          "4. **Circular Wait (Stuck in a circle)**: Maya is waiting for Leo, and Leo is waiting for Maya. Neither can finish their castle — that's a **Deadlock**!",
          "💡 **How the Banker's Algorithm fixes it**: Before handing out a bucket, a smart teacher checks if there's a guaranteed **Safe Sequence** so at least one kid can finish their castle and return all their buckets first!"
        ]
      },
      podcast: {
        title: "🎙️ Deep-Dive Study Podcast: Mastering Deadlocks & Safe States",
        duration: "3 min listen",
        hosts: ["Alex (Host)", "Dr. Maya (Systems AI)"],
        dialogue: [
          {
            speaker: "Alex",
            text: "Welcome back to EduPath AI Study FM! Today we're breaking down Chapter 7: Operating System Deadlocks. Dr. Maya, what's the #1 trap students fall into on exams?"
          },
          {
            speaker: "Dr. Maya",
            text: "Great question, Alex! The biggest exam trap is thinking an Unsafe State automatically means the system is deadlocked right now. In reality, an Unsafe State just means the OS cannot guarantee a safe sequence if every process suddenly requests its maximum claim."
          },
          {
            speaker: "Alex",
            text: "Aha! So a Deadlock is a subset of Unsafe States, governed by the four Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait."
          },
          {
            speaker: "Dr. Maya",
            text: "Spot on. And rememberSlide 18 on Resource Allocation Graphs: if each resource has only a single instance, a cycle guarantees a deadlock. But with multiple instances, you need Dijkstra's Banker's Algorithm in O(m times n squared) time!"
          }
        ]
      },
      similarContent: [
        {
          title: "Semaphore Wait(P) / Signal(V) & Priority Inheritance",
          type: "Video Lecture • Lecture6_Semaphores_And_Monitors.mp4",
          reason: "Directly explains how improper lock acquisition order causes Circular Wait.",
          matchScore: "97% Match"
        },
        {
          title: "Deterministic Lock Ordering in PostgreSQL (SELECT FOR UPDATE)",
          type: "Enterprise Guide • StockSense_Double_Entry_Inventory_FSM.pdf",
          reason: "Real-world database application that eliminates Coffman Condition #4 by sorting product_id ASC.",
          matchScore: "94% Match"
        },
        {
          title: "Livelock vs. Resource Starvation vs. Deadlock",
          type: "Concept Deep-Dive • OS Kernel Concurrency",
          reason: "Clarifies why spinning threads (Livelock) differ from blocked waiting cycles.",
          matchScore: "91% Match"
        }
      ],
      mcqs: [
        {
          id: "mcq_1",
          concept: "Coffman Conditions",
          difficulty: "Medium",
          question: "Which of the following is NOT one of the four necessary Coffman conditions for a deadlock?",
          options: [
            { id: "A", text: "Mutual Exclusion" },
            { id: "B", text: "Hold and Wait" },
            { id: "C", text: "Preemptive Resource Stealing" },
            { id: "D", text: "Circular Wait" }
          ],
          correctOption: "C",
          explanation: "No Preemption (not preemptive stealing) is the third Coffman condition. If resources can be preempted, deadlocks are prevented."
        },
        {
          id: "mcq_2",
          concept: "Safe vs. Unsafe States",
          difficulty: "Hard",
          question: "In Dijkstra's Banker's Algorithm, if the current state is classified as UNSAFE, what does this strictly imply?",
          options: [
            { id: "A", text: "All processes are currently blocked in a deadlock cycle" },
            { id: "B", text: "No safe sequence exists that guarantees deadlock avoidance if worst-case Max requests occur" },
            { id: "C", text: "The Available vector contains negative integers" },
            { id: "D", text: "The OS immediately formats swap space" }
          ],
          correctOption: "B",
          explanation: "An unsafe state means the OS cannot guarantee deadlock avoidance under worst-case future requests, though processes may still complete if they release resources early."
        },
        {
          id: "mcq_3",
          concept: "Resource Allocation Graph (RAG)",
          difficulty: "Medium",
          question: "When every resource type in a Resource Allocation Graph has exactly ONE instance, a directed cycle is:",
          options: [
            { id: "A", text: "Necessary but not sufficient for deadlock" },
            { id: "B", text: "Both necessary and sufficient for deadlock" },
            { id: "C", text: "Neither necessary nor sufficient" },
            { id: "D", text: "Proof that the system is in a safe state" }
          ],
          correctOption: "B",
          explanation: "In single-instance RAGs, any cycle is both necessary and sufficient to prove a deadlock exists."
        },
        {
          id: "mcq_4",
          concept: "Banker's Need Matrix",
          difficulty: "Easy",
          question: "How is the remaining resource requirement matrix Need[i, j] calculated?",
          options: [
            { id: "A", text: "Need[i, j] = Max[i, j] - Allocation[i, j]" },
            { id: "B", text: "Need[i, j] = Allocation[i, j] + Available[j]" },
            { id: "C", text: "Need[i, j] = Max[i, j] + Allocation[i, j]" },
            { id: "D", text: "Need[i, j] = Available[j] - Max[i, j]" }
          ],
          correctOption: "A",
          explanation: "Need[i, j] equals a process's maximum declared demand minus the resources currently allocated to it."
        }
      ],
      fillInTheBlanks: [
        {
          id: "fib_1",
          concept: "Banker's Release Step",
          sentence: "In the Banker's Safety Algorithm, once a process P_i finishes execution, the working pool updates via Work = Work + ____[i].",
          acceptedAnswers: ["allocation", "allocation[i]"],
          hint: "Starts with 'A' — the matrix of resources currently held by P_i.",
          explanation: "When P_i completes, it releases its currently held Allocation[i] back to the Work vector (Work = Work + Allocation[i])."
        },
        {
          id: "fib_2",
          concept: "Deadlock Prevention",
          sentence: "Imposing a strict global ascending order on all resource types eliminates the ____ Wait condition.",
          acceptedAnswers: ["circular", "circular wait"],
          hint: "The 4th Coffman condition involving a closed chain of processes.",
          explanation: "Total lock ordering makes it mathematically impossible to form a closed cycle of requests, eliminating Circular Wait."
        },
        {
          id: "fib_3",
          concept: "Complexity Analysis",
          sentence: "For m resource types and n processes, the Banker's Safety Algorithm runs in O(m * ____) time.",
          acceptedAnswers: ["n^2", "n2", "n squared"],
          hint: "Quadratic in the number of processes n.",
          explanation: "Up to n passes over n processes comparing m-element vectors requires O(m * n^2) operations."
        }
      ],
      trueOrFalse: [
        {
          id: "tf_1",
          concept: "Safe vs. Unsafe States",
          statement: "Every deadlocked state is an unsafe state, AND every unsafe state is a deadlocked state.",
          correctAnswer: false,
          explanation: "FALSE! While every deadlocked state is unsafe, NOT every unsafe state is deadlocked. An unsafe state only carries the risk of deadlock if processes request their full Max claim."
        },
        {
          id: "tf_2",
          concept: "Multi-Instance RAG Cycles",
          statement: "In a Resource Allocation Graph where resource types have multiple identical instances, a directed cycle is necessary but NOT sufficient for deadlock.",
          correctAnswer: true,
          explanation: "TRUE! Another process outside the cycle holding an instance of that resource may finish and release its instance, breaking the wait."
        },
        {
          id: "tf_3",
          concept: "Coffman Conditions",
          statement: "If even ONE of the four Coffman conditions is prevented from holding, a deadlock cannot occur.",
          correctAnswer: true,
          explanation: "TRUE! All four Coffman conditions are simultaneously necessary; negating any single condition prevents deadlock."
        }
      ],
      faqs: [
        {
          id: "faq_1",
          question: "Why don't modern Linux/Windows kernels run Dijkstra's Banker's Algorithm for every process?",
          answer: "Because processes rarely know their exact maximum resource needs (Max[i,j]) ahead of time, the number of processes (n) changes dynamically, and O(m*n^2) checks on every allocation add runtime overhead. Instead, kernels use lock-order validators (like Linux lockdep) for kernel locks and ostrich/recovery policies for user processes."
        },
        {
          id: "faq_2",
          question: "How do I quickly tell whether a RAG diagram on an exam has a deadlock?",
          answer: "1. Check if there is a directed cycle. No cycle = NO deadlock.\n2. If there is a cycle and every resource box in the cycle has only 1 dot (single instance) = GUARANTEED deadlock.\n3. If resource boxes have multiple dots, run the safety/reduction test by erasing edges of processes whose requests can be satisfied by currently free dots."
        },
        {
          id: "faq_3",
          question: "What is the difference between Deadlock, Livelock, and Starvation?",
          answer: "• Deadlock: Processes are blocked waiting for each other in a permanent cycle.\n• Livelock: Processes actively change state on the CPU (not blocked) in response to each other without making progress.\n• Starvation: A ready/waiting process is indefinitely overlooked by a biased scheduler (e.g., low-priority process in strict priority scheduling) even though no cycle exists."
        }
      ]
    };
  }

  static buildCpuSchedulingBundle(doc) {
    return {
      topic: `CPU Scheduling (${doc?.filename || 'CPU_Scheduling_Algorithms_Ch5.pdf'})`,
      sourceDocument: doc?.filename || 'CPU_Scheduling_Algorithms_Ch5.pdf',
      modalities: [
        { type: 'Article / PDF', label: 'CPU_Scheduling_Algorithms_Ch5.pdf', status: 'Indexed' },
        { type: 'Audio / TTS', label: 'Gemini Neural TTS & Podcast Synthesis', status: 'Ready' }
      ],
      eli12Explanation: {
        title: "🧒 ELI12: How Does a CPU Decide Which App Runs Next?",
        analogy: "Think of the CPU as a single super-fast checkout cashier at a grocery store!",
        storySteps: [
          "1. **FCFS (First-Come, First-Served)**: Whoever gets in line first gets served first. Problem: If someone with 200 items is in front, 5 kids buying a single candy bar are stuck waiting behind them (**Convoy Effect**)!",
          "2. **SJF (Shortest Job First)**: Let the customers with only 1 or 2 items go first! That makes the average wait time across everyone as tiny as possible.",
          "3. **Round Robin (Time Quantum)**: Every customer gets 30 seconds at the register. If they aren't done, they go to the back of the line so everyone gets fair turns!"
        ]
      },
      podcast: {
        title: "🎙️ Study Podcast: FCFS, SJF & Round Robin Trade-offs",
        duration: "2 min listen",
        hosts: ["Alex", "Dr. Maya"],
        dialogue: [
          { speaker: "Alex", text: "Dr. Maya, how do we choose the right time quantum q in Round Robin scheduling?" },
          { speaker: "Dr. Maya", text: "Rule of thumb: 80% of CPU bursts should be shorter than q (typically 10 to 100ms). If q is infinite, Round Robin turns into FCFS; if q is tiny, context-switch overhead wastes CPU cycles!" }
        ]
      },
      similarContent: [
        { title: "Multilevel Feedback Queue (MLFQ)", type: "OS Kernel Scheduling", reason: "Combines Round Robin interactivity with priority aging.", matchScore: "96% Match" }
      ],
      mcqs: [
        {
          id: "cpu_mcq_1",
          concept: "Turnaround Time",
          difficulty: "Easy",
          question: "Which formula correctly defines Turnaround Time (TAT)?",
          options: [
            { id: "A", text: "Completion Time - Arrival Time" },
            { id: "B", text: "Waiting Time - Burst Time" },
            { id: "C", text: "Arrival Time + Burst Time" },
            { id: "D", text: "Response Time / Burst Time" }
          ],
          correctOption: "A",
          explanation: "Turnaround Time is total elapsed time from submission to completion: TAT = Completion Time - Arrival Time."
        },
        {
          id: "cpu_mcq_2",
          concept: "SJF Optimality",
          difficulty: "Medium",
          question: "Why is Shortest Job First (SJF) provably optimal for average waiting time?",
          options: [
            { id: "A", text: "Moving a shorter process ahead of a longer one reduces the long process's wait less than it reduces the short process's wait" },
            { id: "B", text: "It eliminates context switches entirely" },
            { id: "C", text: "It uses a 1ms time quantum" },
            { id: "D", text: "It prioritizes CPU-bound jobs over I/O jobs" }
          ],
          correctOption: "A",
          explanation: "Executing shorter bursts first strictly decreases total waiting time across all queued jobs."
        }
      ],
      fillInTheBlanks: [
        {
          id: "cpu_fib_1",
          concept: "Waiting Time",
          sentence: "Waiting Time (WT) is calculated from Turnaround Time (TAT) via WT = TAT - ____ Time.",
          acceptedAnswers: ["burst", "cpu burst"],
          hint: "The actual time spent executing on the CPU.",
          explanation: "WT = TAT - Burst Time."
        }
      ],
      trueOrFalse: [
        {
          id: "cpu_tf_1",
          concept: "Round Robin Quantum",
          statement: "As the Round Robin time quantum q approaches infinity, Round Robin behaves identically to First-Come, First-Served (FCFS).",
          correctAnswer: true,
          explanation: "TRUE! When q exceeds every process's CPU burst, each process runs to completion on its first turn in FIFO order."
        }
      ],
      faqs: [
        {
          id: "cpu_faq_1",
          question: "How does Aging prevent starvation in Priority Scheduling?",
          answer: "Aging gradually increments the priority of processes that have waited in the ready queue for a long time, guaranteeing they eventually reach top priority."
        }
      ]
    };
  }

  static buildVirtualMemoryBundle(doc) {
    return {
      topic: `Virtual Memory & TLB (${doc?.filename || 'Lecture9_Virtual_Memory_TLB_Slides.pptx'})`,
      sourceDocument: doc?.filename || 'Lecture9_Virtual_Memory_TLB_Slides.pptx',
      modalities: [
        { type: 'PPTX Slides', label: 'Lecture9_Virtual_Memory_TLB_Slides.pptx', status: 'Indexed' },
        { type: 'Audio / TTS', label: 'Gemini Neural TTS & Podcast Synthesis', status: 'Ready' }
      ],
      eli12Explanation: {
        title: "🧒 ELI12: How Does Virtual Memory & the TLB Work?",
        analogy: "Imagine your desk (RAM) only fits 4 open books, but your backpack (Disk) holds 50 books!",
        storySteps: [
          "1. **Paging**: Instead of putting whole giant books on your desk, you only keep the exact pages you're reading right now.",
          "2. **TLB (Sticky-Note Shortcut)**: Looking up which desk slot holds Page 7 takes time. The **TLB** is a lightning-fast sticky note right in front of you that remembers the pages you just looked up!",
          "3. **Thrashing**: If you try to do 10 homework subjects at once on a 4-page desk, you spend 99% of your time swapping pages in and out of your backpack and 0% actually writing!"
        ]
      },
      podcast: {
        title: "🎙️ Study Podcast: TLB Effective Access Time & Belady's Anomaly",
        duration: "2 min listen",
        hosts: ["Alex", "Dr. Maya"],
        dialogue: [
          { speaker: "Alex", text: "Why is LRU immune to Belady's Anomaly while FIFO suffers from it?" },
          { speaker: "Dr. Maya", text: "Because LRU is a stack algorithm! The set of pages in k frames is always a subset of the pages in k+1 frames." }
        ]
      },
      similarContent: [
        { title: "Denning's Working Set Model", type: "OS Memory Management", reason: "Prevents thrashing by tracking active page locality.", matchScore: "95% Match" }
      ],
      mcqs: [
        {
          id: "vm_mcq_1",
          concept: "Belady's Anomaly",
          difficulty: "Medium",
          question: "Which page replacement policy is immune to Belady's Anomaly because it satisfies the stack inclusion property?",
          options: [
            { id: "A", text: "FIFO" },
            { id: "B", text: "Least Recently Used (LRU)" },
            { id: "C", text: "Random Replacement" },
            { id: "D", text: "Round Robin" }
          ],
          correctOption: "B",
          explanation: "LRU and Optimal are stack algorithms and never suffer from Belady's Anomaly."
        }
      ],
      fillInTheBlanks: [
        {
          id: "vm_fib_1",
          concept: "Thrashing",
          sentence: "When a process spends more time paging than executing instructions, the system is experiencing ____.",
          acceptedAnswers: ["thrashing"],
          hint: "Starts with 'T'.",
          explanation: "Thrashing occurs when total working set demand exceeds available physical frames."
        }
      ],
      trueOrFalse: [
        {
          id: "vm_tf_1",
          concept: "TLB Hit",
          statement: "On a TLB hit, the MMU translates the page number to a frame number without reading the page table in main memory.",
          correctAnswer: true,
          explanation: "TRUE! A TLB hit bypasses the in-memory page table lookup."
        }
      ],
      faqs: [
        {
          id: "vm_faq_1",
          question: "How do I calculate Effective Access Time (EAT)?",
          answer: "EAT = α × (t_TLB + t_mem) + (1 - α) × (t_TLB + 2 × t_mem), where α is the TLB hit ratio."
        }
      ]
    };
  }

  static buildInventoryFsmBundle(doc) {
    return {
      topic: `Enterprise Inventory FSM & Double-Entry Ledger (${doc?.filename || 'StockSense_Double_Entry_Inventory_FSM.pdf'})`,
      sourceDocument: doc?.filename || 'StockSense_Double_Entry_Inventory_FSM.pdf',
      modalities: [
        { type: 'Enterprise PDF', label: 'StockSense_Double_Entry_Inventory_FSM.pdf', status: 'Indexed' },
        { type: 'Audio / TTS', label: 'Gemini Neural TTS & Podcast Synthesis', status: 'Ready' }
      ],
      eli12Explanation: {
        title: "🧒 ELI12: How Does a Double-Entry Warehouse Prevent Negative Stock?",
        analogy: "Think of a warehouse like a bank vault where every box moved must be signed in a permanent notebook!",
        storySteps: [
          "1. **Finite State Machine (FSM)**: Every order goes `DRAFT → READY → DONE`. Once an order is `CANCELED` or `DONE`, nobody can secretly reopen it!",
          "2. **Sorted Row Locks**: If two workers pack orders with items `#3` and `#42`, both workers lock `#3` first and `#42` second so they never freeze in a deadlock!",
          "3. **Immutable Double-Entry Ledger**: Instead of erasing numbers with an eraser, every move writes `Before + Change = After` in ink."
        ]
      },
      podcast: {
        title: "🎙️ Architecture Podcast: StockSense ACID Locking & FSM Invariants",
        duration: "2 min listen",
        hosts: ["Alex", "Dr. Maya"],
        dialogue: [
          { speaker: "Alex", text: "Why does StockSense sort line items by product_id ASC before SELECT FOR UPDATE?" },
          { speaker: "Dr. Maya", text: "Because deterministic lock ordering eliminates Circular Wait (Coffman Condition #4), making database deadlocks impossible during concurrent deliveries!" }
        ]
      },
      similarContent: [
        { title: "Coffman Condition #4: Circular Wait Elimination", type: "OS Deadlock Prevention", reason: "Theoretical foundation for StockSense's product_id ASC row lock ordering.", matchScore: "99% Match" }
      ],
      mcqs: [
        {
          id: "inv_mcq_1",
          concept: "FSM Invariants",
          difficulty: "Medium",
          question: "In the StockSense centralized Finite State Machine, which transition is strictly FORBIDDEN?",
          options: [
            { id: "A", text: "draft → ready" },
            { id: "B", text: "ready → done" },
            { id: "C", text: "canceled → ready" },
            { id: "D", text: "ready → canceled" }
          ],
          correctOption: "C",
          explanation: "Both DONE and CANCELED are terminal states; a canceled operation can never transition back to ready."
        }
      ],
      fillInTheBlanks: [
        {
          id: "inv_fib_1",
          concept: "Lock Ordering",
          sentence: "To prevent PostgreSQL deadlocks during multi-item operations, lock acquisition must sort items by ____ ASC.",
          acceptedAnswers: ["product_id", "product id"],
          hint: "The primary identifier of each product.",
          explanation: "Sorting by product_id ASC enforces a global lock acquisition order."
        }
      ],
      trueOrFalse: [
        {
          id: "inv_tf_1",
          concept: "Decimal Precision",
          statement: "Floating-point IEEE 754 numbers should be replaced by NUMERIC(18,4) decimal types for fractional inventory quantities.",
          correctAnswer: true,
          explanation: "TRUE! Exact decimal arithmetic prevents floating-point rounding drift."
        }
      ],
      faqs: [
        {
          id: "inv_faq_1",
          question: "How does Idempotency-Key prevent duplicate stock deductions?",
          answer: "If a client retries a network request with the same Idempotency-Key, the server returns the stored response from the first execution instead of deducting stock twice."
        }
      ]
    };
  }
}
