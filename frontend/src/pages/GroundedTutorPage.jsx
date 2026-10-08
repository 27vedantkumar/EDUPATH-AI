import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Presentation,
  Video,
  Loader2,
  User,
  Bot
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SourceCitation } from '../components/citations/SourceCitation';

export const GroundedTutorPage = ({ onNavigateToSource }) => {
  const { currentCourse } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your EduPath Grounded AI Tutor. Everything I teach is strictly grounded in your uploaded materials for **${currentCourse?.title || 'Operating Systems'}** (textbooks, slides, and video lecture recordings). How can I help you today?`,
      citations: [
        {
          source_type: 'pdf',
          document: 'Operating Systems Concepts & Principles.pdf',
          location_label: 'Chapter 7: Deadlocks',
          excerpt: 'A state is safe if the system can allocate resources to each process in some order and still avoid deadlock.',
          relevance: 1.0
        }
      ],
      status: 'SUPPORTED'
    }
  ]);

  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState('beginner');
  const [scopedDocument, setScopedDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  const TUTOR_MODES = [
    { id: 'beginner', label: 'Beginner', desc: 'Analogies & simple step-by-step logic' },
    { id: 'exam', label: 'Exam Mode', desc: 'High-yield points, formulas & pitfalls' },
    { id: 'deep_dive', label: 'Deep Dive', desc: 'Formal proofs & rigorous concurrency' },
    { id: 'socratic', label: 'Socratic', desc: 'Probing questions to diagnose gaps' },
    { id: 'interview', label: 'Interview', desc: 'FAANG-style technical interview questions' },
    { id: 'bilingual', label: 'Bilingual', desc: 'English & multilingual bilingual output' },
  ];

  const QUICK_PROMPTS = [
    "What four Coffman conditions must hold for a deadlock?",
    "How does Dijkstra's Banker's Algorithm check for a safe sequence?",
    "What visual diagram is shown on Slide 18?",
    "What is explained at timestamp 21:43 in Lecture 7 video?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const scopeLoc = scopedDocument ? { document: scopedDocument } : null;
      const res = await api.askTutor(query, selectedMode, currentCourse?.id || 'OS_101', scopeLoc);

      const tutorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer || res.content || res.refusal_message || "I could not retrieve enough grounded evidence for that question.",
        citations: res.citations || [],
        status: res.grounding_status || (res.is_refusal ? 'UNSUPPORTED' : 'SUPPORTED'),
        warning: res.warning || null
      };

      setMessages(prev => [...prev, tutorMsg]);
    } catch (err) {
      console.error('Tutor error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm having trouble connecting to the course knowledge base. Please check backend connection.",
          status: 'UNSUPPORTED'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Text-to-speech audio control
  const toggleSpeech = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Top Controls: Modes & Scope */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Tutoring Mode:
            </span>
          </div>

          {/* Scope Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Knowledge Scope:</span>
            <select
              value={scopedDocument}
              onChange={(e) => setScopedDocument(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            >
              <option value="">Entire Course Knowledge Base</option>
              <option value="Operating Systems.pdf">Textbook (PDF)</option>
              <option value="OS_Lecture7.pptx">Slide Deck (PPTX - Slide 18)</option>
              <option value="Lecture7_Video_Recording.mp4">Lecture Recording (MP4 Transcripts)</option>
            </select>
          </div>
        </div>

        {/* 6 Modes Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {TUTOR_MODES.map((mode) => {
            const isActive = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">{mode.label}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{mode.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm'
                }`}
              >
                {/* Assistant Grounding Badge */}
                {!isUser && msg.status && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      {msg.status === 'SUPPORTED' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" /> Grounded in Course Material
                        </span>
                      )}
                      {msg.status === 'PARTIALLY_SUPPORTED' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertCircle className="w-3 h-3" /> Partial Course Support
                        </span>
                      )}
                      {msg.status === 'UNSUPPORTED' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertCircle className="w-3 h-3" /> Out-of-Domain Refusal
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleSpeech(msg.content)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                      title={isSpeaking ? "Stop read-aloud" : "Read aloud"}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.content}
                </div>

                {/* Citations List */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Source Citations ({msg.citations.length}):
                    </span>
                    <div className="space-y-1">
                      {msg.citations.map((c, idx) => (
                        <SourceCitation
                          key={idx}
                          citation={c}
                          onJump={onNavigateToSource}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
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
              <span>Retrieving source context and verifying grounding gate...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider shrink-0">
          Suggested:
        </span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2 shadow-xl">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Ask about ${currentCourse?.title || 'operating systems'}, formulas, or Slide 18...`}
          className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-md shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
