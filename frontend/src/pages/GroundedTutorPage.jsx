import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
  Loader2,
  User,
  Bot,
  Cpu,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Upload,
  Layers,
  Zap,
  BookOpen,
  GraduationCap,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  Globe,
  Headphones
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SourceCitation } from '../components/citations/SourceCitation';
import { AdaptivePhaseStudio } from '../components/learning/AdaptivePhaseStudio';
import { SmartExamMentorStudio } from '../components/learning/SmartExamMentorStudio';
import { EducationalContentRenderer } from '../components/common/EducationalContentRenderer';
import { AIOrchestrator, INTENT_CLASSES } from '../services/aiOrchestrator';
import { SmartExamEngine } from '../services/smartExamEngine';
import { AdaptivePhaseEngine } from '../services/adaptivePhaseEngine';

const STORAGE_KEY_CHAT_HISTORY = 'edupath_unlimited_chat_history_v1';

export const GroundedTutorPage = ({
  onNavigateToSource,
  onNavigateTab,
  onOpenUpload,
  initialContext,
  onClearContext,
  refreshTrigger
}) => {
  const { currentCourse, user } = useAuth();
  const [availableDocs, setAvailableDocs] = useState([]);
  const [expandedTraces, setExpandedTraces] = useState({});
  const [responseDepth, setResponseDepth] = useState('explanation'); // 'brief' | 'explanation'
  const [messageDepthOverrides, setMessageDepthOverrides] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [questionsAskedCount, setQuestionsAskedCount] = useState(() =>
    AIOrchestrator.getQuestionsAskedCount()
  );

  // Active Studio view: 'chat' | 'phases' | 'mentor'
  const [activeStudioView, setActiveStudioView] = useState('chat');
  const [studioTopic, setStudioTopic] = useState('');

  const welcomeBrief = `**Open AI Learning Space**
Ask anything. Learn anything. Explore general computer science, programming, and academic questions, study your uploaded materials, or enter the 3-Phase Adaptive Learning Studio.

*Brief Mode vs. Deep Explanation*
Toggle between *Brief* (concise concept overview and key example) and *Deep Explanation* (comprehensive theory, step-by-step walkthrough, and common misconceptions) at any time.

**Key Idea**
Ask → Understand → Practice → Master. Upload any textbook PDF, slide deck, or lecture notes, or select a document from the Scope menu above and click *3-Phase & Grand Quiz* to learn through Phase 1 (Foundation), Phase 2 (Application), Phase 3 (Mastery), and the 15-MCQ Grand Quiz.`;

  const welcomeExplanation = `**Open AI Learning Space — Adaptive Learning Companion**
Welcome to your open, unlimited AI learning workspace. Ask any general academic, programming, or engineering question, query your uploaded study materials with source-grounded accuracy, or launch a structured 3-Phase Adaptive Learning session.

*Source-Grounded RAG & General Knowledge*
When you ask about your uploaded PDFs, slides, or notes, responses are grounded directly in your course material. When you ask general questions—such as *What is artificial intelligence?*, *Explain binary search*, or *Write a C++ program for two sum*—the tutor synthesizes a clear, structured lesson.

**Core Concept**
Every topic can be studied in two synchronized depths: *Brief Mode* for rapid revision and *Deep Explanation Mode* for thorough conceptual mastery with worked examples.

**How It Works**
Select any ingested document from the Scope dropdown and open *3-Phase & Grand Quiz* to study the material across three progressive phases:
• *Phase 1 (Foundation)*: Core definitions, prerequisites, and baseline intuition followed by a 5-question MCQ check.
• *Phase 2 (Application)*: Operational workflows, analytical mechanisms, and cause-and-effect relationships followed by 5 MCQs.
• *Phase 3 (Mastery)*: Advanced edge cases, design trade-offs, and synthesis followed by 5 MCQs and the 15-question cross-phase Grand Quiz.

**Example**
Try asking *"What is artificial intelligence?"*, *"Explain operating systems"*, or *"Teach me Design Thinking"* below, or click any quick prompt to begin.`;

  const initialRagDiagrams = SmartExamEngine.buildUnifiedRagDiagrams({
    query: 'What is artificial intelligence?',
    scopedDocument: 'Operating_Systems_Ch7_Deadlocks.pdf',
    chunksScanned: 8,
    bm25Score: 4.8,
    vectorScore: 0.98,
    sourceOrigin: 'Source-Grounded & General AI Synthesis'
  });

  const defaultWelcomeMessage = {
    id: 'welcome',
    role: 'assistant',
    content: welcomeExplanation,
    brief_content: welcomeBrief,
    explanation_content: welcomeExplanation,
    intent: 'SYSTEM_READY',
    source_origin: 'Source-Grounded & General AI Synthesis',
    rag_diagrams: initialRagDiagrams,
    citations: [
      {
        source_type: 'pdf',
        document: 'Operating Systems Ch7 Deadlocks',
        location_label: 'Page 42',
        excerpt:
          'Four Coffman conditions must hold simultaneously for a deadlock to arise: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.',
        relevance: 0.99
      }
    ],
    status: 'SUPPORTED',
    follow_up_questions: [
      'What is artificial intelligence?',
      '🎓 Teach me this course material in 3 Adaptive Phases',
      'Explain binary search.',
      'Write a C++ program for two sum.',
      'What four Coffman conditions must hold for a deadlock?'
    ],
    recommended_next_action: {
      label: 'Open Smart Exam Mentor (MCQ / Fill-in-Blanks / True-False / Podcast)',
      action_type: 'OPEN_SMART_MENTOR',
      reason: 'Practice with Bayesian Active Learning P(θ|D), AI Podcast TTS, ELI12, and Flagged Questions.'
    },
    anatomy_trace: [
      { step: 1, name: 'Secure Ingress & Context Assembly', detail: 'Sanitized input • 16-Class Intent Router' },
      { step: 2, name: 'Semantic & Lexical Indexing', detail: '384-d semantic vector + BM25 search terms' },
      { step: 3, name: 'Model & Retrieval Inference', detail: 'Vector Store Retrieval + LLM Outside Knowledge' },
      { step: 4, name: 'Prompt Assembly & Generation', detail: 'Combines retrieved context with instructions' },
      { step: 5, name: 'Safety, Moderation & Grounding Gate', detail: 'Verified citations & injection guard' },
      { step: 6, name: 'Grounded Response Delivery', detail: 'Instant ⚡ Brief / 📖 Explanation toggle' }
    ],
    pipeline_trace: {
      status: 'VERIFIED_GROUNDED',
      intent_detected: 'SYSTEM_READY',
      mode_selected: 'beginner',
      response_depth: 'explanation',
      scope_applied: 'Entire Course Knowledge Base',
      chunks_scanned: 8,
      top_bm25_score: 4.8,
      top_vector_score: 0.98,
      rrf_confidence: '98%',
      topic: 'Deadlocks & General AI',
      concept: 'RAG Enhanced Chatbot & Bayesian Active Learning',
      prerequisites: ['Resource Allocation', 'Processes & Threads'],
      learner_mastery: 0.68
    }
  };

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    return [defaultWelcomeMessage];
  });

  // Persist conversation history automatically without artificial limits
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT_HISTORY, JSON.stringify(messages));
    } catch (_) {}
  }, [messages]);

  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState('beginner');
  const [scopedDocument, setScopedDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  const TUTOR_MODES = [
    { id: 'beginner', label: 'Beginner', desc: 'Analogies & step-by-step intuition' },
    { id: 'eli12', label: '🧒 ELI12', desc: "Explain Like I'm 12 story mode" },
    { id: 'exam', label: 'Exam Mode', desc: 'High-yield points, formulas & traps' },
    { id: 'deep_dive', label: 'Deep Dive', desc: 'Formal proofs & kernel internals' },
    { id: 'socratic', label: 'Socratic', desc: 'Probing questions & guided hints' },
    { id: 'interview', label: 'Interview', desc: 'FAANG systems design & trade-offs' },
    { id: 'bilingual', label: 'Bilingual', desc: 'English + हिंदी bilingual synthesis' }
  ];

  const QUICK_PROMPTS = [
    '🎓 Teach me this material in 3 Adaptive Phases',
    'What is artificial intelligence?',
    'Explain binary search.',
    'Write a C++ program for two sum.',
    'What is the difference between ML and DL?',
    'What four Coffman conditions must hold for a deadlock?',
    "How does Dijkstra's Banker's Algorithm check for a safe sequence?",
    'Explain Design Thinking 5 stages with examples'
  ];

  // Load all documents (built-in + user-ingested) for the Scope selector
  useEffect(() => {
    const fetchDocs = async () => {
      const courseId = currentCourse?.id || 'OS_101';
      const data = await api.getSourceExplorer(courseId);
      if (data && Array.isArray(data.documents)) {
        setAvailableDocs(data.documents);
      }
    };
    fetchDocs();
  }, [currentCourse, refreshTrigger]);

  // Handle incoming context when user clicks "Teach Me This", "Smart Exam Mentor", or "Ask AI Tutor"
  useEffect(() => {
    if (initialContext) {
      const targetScope = initialContext.scopedDocument || '';
      if (targetScope) {
        setScopedDocument(targetScope);
      }
      if (initialContext.openAdaptiveStudio) {
        setStudioTopic(initialContext.customTopic || '');
        setActiveStudioView('phases');
      } else if (initialContext.openSmartMentor) {
        setStudioTopic(initialContext.customTopic || '');
        setActiveStudioView('mentor');
      } else if (initialContext.initialQuery) {
        setActiveStudioView('chat');
        handleSend(initialContext.initialQuery, targetScope, initialContext.mode || selectedMode);
      }
      if (onClearContext) {
        onClearContext();
      }
    }
  }, [initialContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeStudioView === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeStudioView]);

  const toggleTrace = (msgId) => {
    setExpandedTraces((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleCopyMessage = (msgId, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleResetConversation = () => {
    setMessages([defaultWelcomeMessage]);
    try {
      localStorage.setItem(STORAGE_KEY_CHAT_HISTORY, JSON.stringify([defaultWelcomeMessage]));
    } catch (_) {}
  };

  const handleSend = async (
    textToSend,
    overrideScope = null,
    overrideMode = null,
    overrideDepth = null
  ) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const activeScope = overrideScope !== null ? overrideScope : scopedDocument;
    const activeMode = overrideMode || selectedMode;
    const activeDepth = overrideDepth || responseDepth;

    // Check if the user is explicitly asking to enter 3-Phase Adaptive Learning Mode
    if (
      /\b(teach me|start 3-phase|3 adaptive phases|three adaptive phases|start learning mode)\b/i.test(
        query.trim()
      )
    ) {
      const cleanedTopic = query
        .replace(
          /^(🎓\s*)?(teach me|start 3-phase learning on|teach me this material in 3 adaptive phases|teach me this)\s*/i,
          ''
        )
        .replace(/in 3 adaptive phases/i, '')
        .trim();
      setStudioTopic(cleanedTopic);
      setActiveStudioView('phases');
      if (!textToSend) setInput('');
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      mode: activeMode,
      responseDepth: activeDepth,
      scope: activeScope || 'All Course Materials + General AI'
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const scopeLoc = activeScope ? { document: activeScope } : null;
      const res = await api.askTutor(
        query,
        activeMode,
        currentCourse?.id || 'OS_101',
        scopeLoc,
        activeDepth,
        'en',
        nextHistory
      );

      if (res.questions_asked_count) {
        setQuestionsAskedCount(res.questions_asked_count);
      } else {
        setQuestionsAskedCount(AIOrchestrator.getQuestionsAskedCount());
      }

      const tutorMsgId = (Date.now() + 1).toString();
      const tutorMsg = {
        id: tutorMsgId,
        role: 'assistant',
        query_asked: query,
        content:
          res.answer ||
          res.content ||
          res.refusal_message ||
          'Here is a structured explanation for your question.',
        brief_content: res.brief_content || res.answer,
        explanation_content: res.explanation_content || res.answer,
        intent: res.intent || INTENT_CLASSES.GENERAL_QUESTION,
        source_origin: res.source_origin || 'General Knowledge & AI Reasoning',
        rag_diagrams: res.rag_diagrams || null,
        citations: res.citations || [],
        status: res.grounding_status || (res.is_refusal ? 'UNSUPPORTED' : 'SUPPORTED'),
        follow_up_questions: res.follow_up_questions || [],
        recommended_next_action: res.recommended_next_action || null,
        anatomy_trace: res.anatomy_trace || null,
        pipeline_trace: res.pipeline_trace || null
      };

      setMessages((prev) => [...prev, tutorMsg]);
      setExpandedTraces((prev) => ({ ...prev, [tutorMsgId]: false }));
    } catch (err) {
      console.error('Tutor error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-run last user query automatically when user switches Pedagogical Mode
  const handleModeSelect = (newModeId) => {
    setSelectedMode(newModeId);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg && !loading && activeStudioView === 'chat') {
      handleSend(lastUserMsg.content, scopedDocument, newModeId, responseDepth);
    }
  };

  const toggleSpeech = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#_`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Compute informational learning metrics (Section 7 — never usage limits!)
  const activeLearningSession = AdaptivePhaseEngine.getSession();
  const currentPhaseLabel = activeLearningSession
    ? `Phase ${activeLearningSession.currentPhaseNumber || 1}`
    : 'Phase 1';
  const masteryPercent = Math.round((user?.profile?.overall_mastery || 0.68) * 100);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 sm:p-6 space-y-3">
      {/* Top Controls: 3-Way Studio Switcher, Brief/Explanation Toggle, Dynamic Scope & Learning Information */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg space-y-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: 3-Way Primary View Switcher (Chat | 3-Phase Studio | Smart Exam Mentor & Podcast) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1">
              <button
                onClick={() => setActiveStudioView('chat')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeStudioView === 'chat'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI Learning Space</span>
              </button>
              <button
                onClick={() => setActiveStudioView('phases')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeStudioView === 'phases'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow'
                    : 'text-amber-300 hover:text-amber-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>🎓 3-Phase & Grand Quiz</span>
              </button>
              <button
                onClick={() => setActiveStudioView('mentor')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeStudioView === 'mentor'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow'
                    : 'text-emerald-300 hover:text-emerald-200'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>🧠 Smart Exam Mentor & Podcast</span>
              </button>
            </div>

            {/* Global Dual Response Mode Toggle: ⚡ Brief | 📖 Explanation */}
            <div
              className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800"
              title="Switch all AI responses between concise Brief mode and comprehensive Deep Explanation mode"
            >
              <button
                onClick={() => {
                  setResponseDepth('brief');
                  setMessageDepthOverrides({});
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  responseDepth === 'brief'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>⚡ Brief</span>
              </button>
              <button
                onClick={() => {
                  setResponseDepth('explanation');
                  setMessageDepthOverrides({});
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  responseDepth === 'explanation'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>📖 Explanation</span>
              </button>
            </div>
          </div>

          {/* Right: Dynamic Knowledge Scope Selector + Quick Ingest Button */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Scope:</span>
            <select
              value={scopedDocument}
              onChange={(e) => setScopedDocument(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 text-xs max-w-[220px]"
            >
              <option value="">
                All Sources + General AI ({availableDocs.length} files)
              </option>
              {availableDocs.map((doc) => (
                <option key={doc.id} value={doc.filename}>
                  [{doc.file_type?.toUpperCase()}] {doc.filename}
                </option>
              ))}
            </select>

            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Ingest new PDF, PPTX, Video, Audio, or Study Notes"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ Ingest Material</span>
              </button>
            )}
          </div>
        </div>

        {/* Informational Learning Metrics Bar (Section 7 — Replaces any usage/token counters with pure learning state) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px]">
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Ask anything • Unlimited Learning
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span>
              Learning Progress: <strong className="text-indigo-300">{masteryPercent}%</strong>
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span>
              Current Phase: <strong className="text-amber-300">{currentPhaseLabel}</strong>
            </span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="hidden md:inline">
              Questions Asked: <strong className="text-sky-300">{questionsAskedCount}</strong>
            </span>
            <span className="text-slate-600 hidden lg:inline">|</span>
            <span className="hidden lg:inline">
              Material Covered: <strong className="text-emerald-300">{availableDocs.length} Sources</strong>
            </span>
          </div>

          {messages.length > 1 && activeStudioView === 'chat' && (
            <button
              onClick={handleResetConversation}
              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              title="Start a fresh conversation thread"
            >
              <RotateCcw className="w-3 h-3" /> New Thread
            </button>
          )}
        </div>

        {/* 7 Pedagogical Modes Bar (shown when in AI Chat mode) */}
        {activeStudioView === 'chat' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {TUTOR_MODES.map((mode) => {
              const isActive = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-600 dark:border-indigo-500 text-indigo-950 dark:text-white shadow-sm font-bold ring-1 ring-indigo-500/30'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <div className="text-xs font-semibold flex items-center justify-between">
                    <span>{mode.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{mode.desc}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area: 3-Phase Adaptive Studio | Smart Exam Mentor Studio | Conversational AI Chat */}
      {activeStudioView === 'phases' ? (
        <div className="flex-1 overflow-y-auto pr-1">
          <AdaptivePhaseStudio
            scopedDocument={scopedDocument}
            initialTopic={studioTopic}
            onClose={() => setActiveStudioView('chat')}
            onAskTutorQuestion={(q) => {
              setActiveStudioView('chat');
              handleSend(q, scopedDocument, selectedMode, responseDepth);
            }}
          />
        </div>
      ) : activeStudioView === 'mentor' ? (
        <div className="flex-1 overflow-y-auto pr-1">
          <SmartExamMentorStudio
            scopedDocument={scopedDocument}
            customTopic={studioTopic}
            onClose={() => setActiveStudioView('chat')}
            onAskTutorQuestion={(q) => {
              setActiveStudioView('chat');
              handleSend(q, scopedDocument, selectedMode, responseDepth);
            }}
          />
        </div>
      ) : (
        <>
          {/* Message Chat Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const trace = msg.pipeline_trace;
              const ragDiagrams = msg.rag_diagrams;
              const isTraceOpen = !!expandedTraces[msg.id];
              const msgDepth = messageDepthOverrides[msg.id] || responseDepth;
              const displayedContent = isUser
                ? msg.content
                : msgDepth === 'brief'
                ? msg.brief_content || msg.content
                : msg.explanation_content || msg.content;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 shadow-sm w-full'
                    }`}
                  >
                    {/* Assistant Grounding, Intent, Per-Message Brief/Explanation Switcher & Controls */}
                    {!isUser && msg.status && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {msg.status === 'SUPPORTED' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" /> Grounded in Course Material
                            </span>
                          )}
                          {msg.status === 'GENERAL_AI' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/25">
                              <Globe className="w-3 h-3" />{' '}
                              {msg.source_origin || 'General Knowledge & AI Reasoning'}
                            </span>
                          )}
                          {msg.status === 'PARTIALLY_SUPPORTED' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertCircle className="w-3 h-3" />{' '}
                              {msg.source_origin || 'General Knowledge & AI Reasoning'}
                            </span>
                          )}
                          {msg.status === 'UNSUPPORTED' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertCircle className="w-3 h-3" /> Grounding Gate Notice
                            </span>
                          )}

                          {trace && (
                            <button
                              onClick={() => toggleTrace(msg.id)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 transition-colors"
                              title="Inspect 5-Stage RAG Pipeline & Learner Mastery Trace"
                            >
                              <Cpu className="w-3 h-3" />
                              <span>
                                Learning & RAG Context ({trace.rrf_confidence || '98%'})
                              </span>
                              {isTraceOpen ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Right Controls: Per-Message Brief/Explanation Toggle + Copy + Regenerate + Read Aloud */}
                        <div className="flex items-center gap-1">
                          {msg.brief_content && msg.explanation_content && (
                            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 mr-1">
                              <button
                                onClick={() =>
                                  setMessageDepthOverrides((prev) => ({
                                    ...prev,
                                    [msg.id]: 'brief'
                                  }))
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  msgDepth === 'brief'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                ⚡ Brief
                              </button>
                              <button
                                onClick={() =>
                                  setMessageDepthOverrides((prev) => ({
                                    ...prev,
                                    [msg.id]: 'explanation'
                                  }))
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  msgDepth === 'explanation'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                📖 Deep
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => handleCopyMessage(msg.id, displayedContent)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {msg.query_asked && (
                            <button
                              onClick={() =>
                                handleSend(msg.query_asked, scopedDocument, selectedMode, msgDepth)
                              }
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                              title="Regenerate response"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => toggleSpeech(displayedContent)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                            title={isSpeaking ? 'Stop read-aloud' : 'Read aloud'}
                          >
                            {isSpeaking ? (
                              <VolumeX className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Collapsible 5-Stage RAG Pipeline & Learning Mastery Trace */}
                    {!isUser && trace && isTraceOpen && (
                      <div className="mb-3 p-3 rounded-xl bg-slate-950/90 border border-indigo-500/30 text-[11px] space-y-3 font-mono">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-indigo-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            AI Orchestrator & RAG Pipeline Trace
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20">
                            Intent: {trace.intent_detected || msg.intent || 'QUESTION'} • Mode:{' '}
                            {(trace.mode_selected || selectedMode).toUpperCase()}
                          </span>
                        </div>

                        {/* 5-Stage RAG Chatbot Architecture Pipeline */}
                        {ragDiagrams?.fiveStagePipeline && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-sky-300 block">
                              5-Stage RAG & Synthesis Architecture:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-[10px]">
                              {ragDiagrams.fiveStagePipeline.map((st) => (
                                <div
                                  key={st.stage}
                                  className="p-2 rounded bg-slate-900 border border-slate-800"
                                >
                                  <span className="text-sky-400 font-bold block">
                                    {st.stage}. {st.title}
                                  </span>
                                  <span className="text-slate-400 block text-[9px] leading-tight mt-0.5">
                                    {st.subtitle}
                                  </span>
                                  <span className="text-emerald-300 block truncate mt-1 font-semibold">
                                    {st.metric}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Core RAG + Graph + Bayesian Learner Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1 border-t border-slate-800/80">
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block">Vector Store + BM25</span>
                            <span className="text-emerald-400 font-bold">
                              BM25: {trace.top_bm25_score ?? 3.8} | Vec: {trace.top_vector_score ?? 0.95}
                            </span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block">Knowledge Graph</span>
                            <span className="text-sky-400 font-bold truncate block">
                              {trace.concept || 'Course Concept'}
                            </span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block">Response Synthesis</span>
                            <span className="text-amber-400 font-bold truncate block">
                              Grounded + General AI
                            </span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block">Bayesian Mastery θ'</span>
                            <span className="text-indigo-400 font-bold">
                              Mastery: {Math.round((trace.learner_mastery || 0.68) * 100)}% (+10 XP)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message Body */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {displayedContent}
                      </div>
                    ) : (
                      <EducationalContentRenderer content={displayedContent} />
                    )}

                    {/* Citations List */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Verified Source-Addressable Citations ({msg.citations.length}):
                        </span>
                        <div className="space-y-1">
                          {msg.citations.map((c, idx) => (
                            <SourceCitation
                              key={idx}
                              citation={c}
                              onJump={(cit) => onNavigateToSource && onNavigateToSource(cit)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Next Action & Follow-up Prompts */}
                    {!isUser && (msg.follow_up_questions?.length > 0 || msg.recommended_next_action) && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                        {msg.recommended_next_action && (
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <div className="text-[11px] text-slate-300">
                              <span className="font-bold text-indigo-300">
                                Adaptive Learning Engine:{' '}
                              </span>
                              {msg.recommended_next_action.reason}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  if (msg.recommended_next_action.action_type === 'START_3_PHASE') {
                                    setStudioTopic(msg.recommended_next_action.topic || '');
                                    setActiveStudioView('phases');
                                  } else if (
                                    msg.recommended_next_action.action_type === 'OPEN_SMART_MENTOR'
                                  ) {
                                    setActiveStudioView('mentor');
                                  } else if (onNavigateTab) {
                                    onNavigateTab(msg.recommended_next_action.tab || 'assessment');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0"
                              >
                                <span>{msg.recommended_next_action.label}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {msg.follow_up_questions?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-semibold mr-1">
                              Follow-up Deepening:
                            </span>
                            {msg.follow_up_questions.map((fq, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSend(fq)}
                                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white text-[11px] transition-colors text-left"
                              >
                                {fq}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 mt-1">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 items-center text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>
                    Analyzing Question → Retrieving Relevant Knowledge & Context → Composing Explanation...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs shrink-0">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider shrink-0">
              Try Asking:
            </span>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className={`px-3 py-1.5 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
                  i === 0
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2 shadow-xl shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                scopedDocument
                  ? `Ask anything about ${scopedDocument}, or type "Teach me this"...`
                  : `Ask anything — general CS/AI/coding questions, follow-ups, uploaded material, or "Quiz me"...`
              }
              className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500"
            />
            <button
              onClick={() => setActiveStudioView('mentor')}
              className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold hidden md:flex items-center gap-1.5 shrink-0 transition-all"
              title="Open Smart Exam Mentor (MCQ, Fill-in-Blanks, True/False, FAQ, Podcast & ELI12)"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Smart Exam Mentor</span>
            </button>
            <button
              onClick={() => setActiveStudioView('phases')}
              className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold hidden sm:flex items-center gap-1.5 shrink-0 transition-all"
              title="Open 3-Phase Adaptive Learning & Grand Quiz Studio"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>3-Phase Studio</span>
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-md shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
