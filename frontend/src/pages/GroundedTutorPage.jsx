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
  Network,
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
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SourceCitation } from '../components/citations/SourceCitation';
import { AdaptivePhaseStudio } from '../components/learning/AdaptivePhaseStudio';
import { INTENT_CLASSES } from '../services/aiOrchestrator';

export const GroundedTutorPage = ({
  onNavigateToSource,
  onNavigateTab,
  onOpenUpload,
  initialContext,
  onClearContext,
  refreshTrigger
}) => {
  const { currentCourse } = useAuth();
  const [availableDocs, setAvailableDocs] = useState([]);
  const [expandedTraces, setExpandedTraces] = useState({});
  const [responseDepth, setResponseDepth] = useState('explanation'); // 'brief' | 'explanation'
  const [messageDepthOverrides, setMessageDepthOverrides] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // 3-Phase Adaptive Learning Studio state
  const [showAdaptiveStudio, setShowAdaptiveStudio] = useState(false);
  const [studioTopic, setStudioTopic] = useState('');

  const welcomeBrief = `### ⚡ Brief Mode — Unified General-Purpose LLM + Grounded RAG + 3-Phase Adaptive Tutor\n• **Ask Anything (General AI)**: Ask about *Binary Search*, *Photosynthesis*, *Computer Networks (OSI/TCP)*, *Design Thinking*, or *Enterprise Inventory FSM*.\n• **Ask Uploaded Material (Contextual RAG)**: Grounded in your PDFs, PPTX slides, MP4 lecture timestamps, and custom notes with exact citations.\n• **🎓 3-Phase Adaptive Learning & Grand Quiz**: Click **"3-Phase Adaptive Studio"** above or type *"Teach me this"* to learn across **Phase 1 → Phase 2 → Phase 3** (5 MCQs each) + **15-MCQ Grand Quiz**!`;

  const welcomeExplanation = `Hello! I am your **Unified General-Purpose AI Tutor, Contextual RAG Assistant & 3-Phase Adaptive Learning Engine**.\n\n### 🚀 What You Can Do Here:\n1. **General-Purpose LLM Questions**: Ask *any* academic, coding, systems, or science question (e.g., *"What is binary search?"*, *"Explain Design Thinking"*, *"Explain Double-Entry Inventory FSM & Lock Ordering"*).\n2. **Source-Grounded RAG Questions**: Ask about your uploaded course materials, PDFs, slides, or video timestamps with verified citations.\n3. **⚡ Brief vs. 📖 Explanation Mode**: Toggle between concise high-signal summaries and deep step-by-step explanations at any time.\n4. **🎓 AI-Decided 3-Phase Learning & Grand Quiz**: Say **"Teach me this"** or click **3-Phase Adaptive Studio** above to let the AI partition your material into **Phase 1, Phase 2, and Phase 3**, test you with **5 MCQs per phase**, and unlock the **15-MCQ Cross-Phase Grand Quiz**!`;

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: welcomeExplanation,
      brief_content: welcomeBrief,
      explanation_content: welcomeExplanation,
      intent: 'SYSTEM_READY',
      source_origin: 'Hybrid RAG + General AI Orchestrator',
      citations: [
        {
          source_type: 'pdf',
          document: 'Operating_Systems_Ch7_Deadlocks.pdf',
          location_label: 'Page 42 • Section 7.2 Deadlock Characterization',
          excerpt:
            'Four Coffman conditions must hold simultaneously for a deadlock to arise: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.',
          relevance: 0.99
        }
      ],
      status: 'SUPPORTED',
      follow_up_questions: [
        '🎓 Teach me this course material in 3 Adaptive Phases',
        'What is binary search? Explain with complexity & code',
        'What four Coffman conditions must hold for a deadlock?',
        "How does Dijkstra's Banker's Algorithm check for a safe sequence?",
        'Explain Enterprise Inventory Double-Entry Ledger & FSM Lock Ordering'
      ],
      recommended_next_action: {
        label: 'Launch 3-Phase Adaptive Learning & Grand Quiz',
        action_type: 'START_3_PHASE',
        reason: 'Master the material through Phase 1, Phase 2, Phase 3 MCQs and the 15-question Grand Quiz.'
      },
      anatomy_trace: [
        { step: 1, name: 'Secure Ingress & Context Assembly', detail: 'Sanitized input • 16-Class Intent Router' },
        { step: 2, name: 'Tokenization & Query Embedding', detail: '384-d semantic vector + BM25 lexical index' },
        { step: 3, name: 'Model & Retrieval Inference', detail: 'General LLM + Hybrid RAG Fusion' },
        { step: 4, name: 'Tool & RAG Execution', detail: 'Source-Addressable Knowledge Graph lookup' },
        { step: 5, name: 'Safety, Moderation & Grounding Gate', detail: 'Verified citations & injection guard' },
        { step: 6, name: 'Dual Brief & Explanation Synthesis', detail: 'Instant ⚡ Brief / 📖 Explanation toggle' }
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
        topic: 'Deadlocks & Systems',
        concept: 'Coffman Conditions, Safe States & General AI',
        prerequisites: ['Resource Allocation', 'Processes & Threads'],
        learner_mastery: 0.62
      }
    }
  ]);

  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState('beginner');
  const [scopedDocument, setScopedDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  const TUTOR_MODES = [
    { id: 'beginner', label: 'Beginner', desc: 'Analogies & step-by-step intuition' },
    { id: 'exam', label: 'Exam Mode', desc: 'High-yield points, formulas & traps' },
    { id: 'deep_dive', label: 'Deep Dive', desc: 'Formal proofs & kernel internals' },
    { id: 'socratic', label: 'Socratic', desc: 'Probing questions & guided hints' },
    { id: 'interview', label: 'Interview', desc: 'FAANG systems design & trade-offs' },
    { id: 'bilingual', label: 'Bilingual', desc: 'English + हिंदी bilingual synthesis' }
  ];

  const QUICK_PROMPTS = [
    '🎓 Teach me this material in 3 Adaptive Phases',
    'What is binary search?',
    'What four Coffman conditions must hold for a deadlock?',
    "How does Dijkstra's Banker's Algorithm check for a safe sequence?",
    'Explain Enterprise Inventory FSM, Lock Ordering & Double-Entry Ledger',
    'Explain Design Thinking 5 stages with examples',
    'Explain OSI Model & TCP 3-Way Handshake',
    'What is explained at timestamp 21:43 in Lecture 7 video?'
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

  // Handle incoming context when user clicks "Teach Me This" or "Ask AI Tutor About This" from IngestionModal, SourceExplorer, etc.
  useEffect(() => {
    if (initialContext) {
      const targetScope = initialContext.scopedDocument || '';
      if (targetScope) {
        setScopedDocument(targetScope);
      }
      if (initialContext.openAdaptiveStudio) {
        setStudioTopic(initialContext.customTopic || '');
        setShowAdaptiveStudio(true);
      } else if (initialContext.initialQuery) {
        setShowAdaptiveStudio(false);
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
    if (!showAdaptiveStudio) {
      scrollToBottom();
    }
  }, [messages, showAdaptiveStudio]);

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
      setShowAdaptiveStudio(true);
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

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const scopeLoc = activeScope ? { document: activeScope } : null;
      const res = await api.askTutor(
        query,
        activeMode,
        currentCourse?.id || 'OS_101',
        scopeLoc,
        activeDepth
      );

      const tutorMsgId = (Date.now() + 1).toString();
      const tutorMsg = {
        id: tutorMsgId,
        role: 'assistant',
        query_asked: query,
        content:
          res.answer ||
          res.content ||
          res.refusal_message ||
          'I could not retrieve enough grounded evidence for that question.',
        brief_content: res.brief_content || res.answer,
        explanation_content: res.explanation_content || res.answer,
        intent: res.intent || INTENT_CLASSES.GENERAL_QUESTION,
        source_origin: res.source_origin || 'Hybrid RAG + General AI',
        citations: res.citations || [],
        status: res.grounding_status || (res.is_refusal ? 'UNSUPPORTED' : 'SUPPORTED'),
        follow_up_questions: res.follow_up_questions || [],
        recommended_next_action: res.recommended_next_action || null,
        anatomy_trace: res.anatomy_trace || null,
        pipeline_trace: res.pipeline_trace || null
      };

      setMessages((prev) => [...prev, tutorMsg]);
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
    if (lastUserMsg && !loading && !showAdaptiveStudio) {
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 sm:p-6 space-y-3">
      {/* Top Controls: Mode Switcher, Brief/Explanation Toggle, 3-Phase Studio Toggle, Dynamic Scope & Ingest Trigger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg space-y-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Chat vs 3-Phase Studio Primary View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setShowAdaptiveStudio(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  !showAdaptiveStudio
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI Tutor & RAG Chat</span>
              </button>
              <button
                onClick={() => setShowAdaptiveStudio(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  showAdaptiveStudio
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow'
                    : 'text-amber-300 hover:text-amber-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>🎓 3-Phase Adaptive Studio & Grand Quiz</span>
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
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 text-xs max-w-[230px]"
            >
              <option value="">
                All Course Material + General AI ({availableDocs.length} sources)
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
                title="Ingest new PDF, PPTX, Video, or Study Notes into Tutor & 3-Phase Engine"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ Ingest Material</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 Pedagogical Modes Bar (shown when in AI Chat mode) */}
        {!showAdaptiveStudio && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {TUTOR_MODES.map((mode) => {
              const isActive = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
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

      {/* Main Content Area: Either 3-Phase Adaptive Learning Studio OR Conversational AI Chat */}
      {showAdaptiveStudio ? (
        <div className="flex-1 overflow-y-auto pr-1">
          <AdaptivePhaseStudio
            scopedDocument={scopedDocument}
            initialTopic={studioTopic}
            onClose={() => setShowAdaptiveStudio(false)}
            onAskTutorQuestion={(q) => {
              setShowAdaptiveStudio(false);
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
              const anatomy = msg.anatomy_trace;
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
                        : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm w-full'
                    }`}
                  >
                    {/* Assistant Grounding, Intent, Per-Message Brief/Explanation Switcher & Controls */}
                    {!isUser && msg.status && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {msg.status === 'SUPPORTED' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" /> Grounded in Course Material
                            </span>
                          )}
                          {msg.status === 'GENERAL_AI' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/25">
                              <Globe className="w-3 h-3" /> {msg.source_origin || 'General AI Knowledge'}
                            </span>
                          )}
                          {msg.status === 'PARTIALLY_SUPPORTED' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertCircle className="w-3 h-3" /> {msg.source_origin || 'General Knowledge Fallback'}
                            </span>
                          )}
                          {msg.status === 'UNSUPPORTED' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertCircle className="w-3 h-3" /> Grounding Gate Refusal
                            </span>
                          )}

                          {trace && (
                            <button
                              onClick={() => toggleTrace(msg.id)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 transition-colors"
                              title="Inspect 6-Step Query Anatomy & Hybrid RAG Execution Trace"
                            >
                              <Cpu className="w-3 h-3" />
                              <span>
                                Query Anatomy & RAG Trace ({trace.rrf_confidence || '98%'})
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

                    {/* Collapsible 6-Step Query Anatomy & RAG Architecture Trace Box */}
                    {!isUser && trace && isTraceOpen && (
                      <div className="mb-3 p-3 rounded-xl bg-slate-950/90 border border-indigo-500/30 text-[11px] space-y-2.5 font-mono">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-indigo-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            6-Step Query Anatomy & Hybrid RAG Execution Trace
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20">
                            Intent: {trace.intent_detected || msg.intent || 'QUESTION'} • Mode:{' '}
                            {(trace.mode_selected || selectedMode).toUpperCase()}
                          </span>
                        </div>

                        {anatomy && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                            {anatomy.map((st) => (
                              <div
                                key={st.step}
                                className="p-2 rounded bg-slate-900/90 border border-slate-800"
                              >
                                <span className="text-indigo-400 font-bold block">
                                  {st.step}. {st.name}
                                </span>
                                <span className="text-slate-400 truncate block">{st.detail}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1 border-t border-slate-800/80">
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block">Hybrid RAG Core</span>
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
                            <span className="text-slate-400 block">Prerequisites</span>
                            <span className="text-amber-400 font-bold truncate block">
                              {(trace.prerequisites || ['Core Logic']).join(', ')}
                            </span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block">Learner Model</span>
                            <span className="text-indigo-400 font-bold">
                              Mastery: {Math.round((trace.learner_mastery || 0.62) * 100)}% (+10 XP)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                      {displayedContent}
                    </div>

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
                                    setShowAdaptiveStudio(true);
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
                    Executing Intent Router → Hybrid RAG (Vector + Okapi BM25) → General LLM & Dual Brief/Explanation Synthesis...
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
                  ? `Ask about ${scopedDocument}, or type "Teach me this" for 3-Phase Adaptive Mode...`
                  : `Ask ANY question (e.g., "What is binary search?", "Explain Deadlocks", or "Teach me this")...`
              }
              className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500"
            />
            <button
              onClick={() => setShowAdaptiveStudio(true)}
              className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold hidden sm:flex items-center gap-1.5 shrink-0 transition-all"
              title="Open 3-Phase Adaptive Learning & Grand Quiz Studio"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Teach Me (3 Phases)</span>
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
