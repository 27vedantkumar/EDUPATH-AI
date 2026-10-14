import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Globe,
  Maximize2,
  ExternalLink,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { EducationalContentRenderer } from './EducationalContentRenderer';

export const FloatingStudyBuddy = ({ onNavigateToTutor }) => {
  const { themeConfig, isNight } = useTheme();
  const { currentCourse } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome_buddy',
      sender: 'assistant',
      text: 'Hello! I am your AI Study Buddy. Ask me any general-purpose academic, coding, or course question, or toggle live web search anytime!',
      web_sources: [],
      related_questions: [
        'Explain binary search algorithm',
        'How does live web grounding work?',
        'What are the 4 Coffman deadlock conditions?'
      ]
    }
  ]);

  const handleAsk = async (textToSend) => {
    const q = textToSend || query;
    if (!q.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const res = await api.askTutor(
        q,
        'beginner',
        currentCourse?.id || 'OS_101',
        null,
        'explanation',
        'en',
        messages,
        { enable_web_search: enableWebSearch }
      );

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer || res.content || 'Here is the explanation for your query.',
        web_sources: res.web_sources || [],
        citations: res.citations || [],
        related_questions: res.related_questions || res.follow_up_questions || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'I ran into a temporary connection issue. Please try again.',
          web_sources: [],
          related_questions: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all cursor-pointer border border-indigo-400/30"
          title="Open AI Study Buddy"
        >
          <Sparkles className="w-4 h-4 fill-current text-amber-300" />
          <span>Ask AI Study Buddy</span>
        </button>
      )}

      {/* Floating Assistant Drawer / Modal */}
      {isOpen && (
        <div
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderCard
          }}
          className="w-96 max-w-[calc(100vw-2rem)] h-[540px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  AI Study Buddy
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  General AI & Live Web Search
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onNavigateToTutor && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateToTutor('tutor');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Expand to Full Tutor Workspace"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Web Search Bar Pill */}
          <div className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <button
              onClick={() => setEnableWebSearch(!enableWebSearch)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold transition-all ${
                enableWebSearch
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Live Web Grounding: {enableWebSearch ? 'ON' : 'OFF'}</span>
            </button>
            <span className="text-[10px] text-slate-400">Zero token limits</span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[88%] ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    ) : (
                      <EducationalContentRenderer content={m.text} />
                    )}
                  </div>

                  {/* Web Sources if present */}
                  {!isUser && m.web_sources && m.web_sources.length > 0 && (
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] space-y-1 max-w-[90%]">
                      <span className="font-bold text-slate-400 block flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-400" />
                        Verified Live Sources ({m.web_sources.length}):
                      </span>
                      {m.web_sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between text-indigo-400 hover:underline gap-2"
                        >
                          <span className="truncate">[{src.citation_id || i + 1}] {src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Dynamic Related Questions */}
                  {!isUser && m.related_questions && m.related_questions.length > 0 && (
                    <div className="space-y-1 max-w-[95%] pt-1">
                      <span className="text-[10px] font-bold text-slate-400">Explore further:</span>
                      <div className="flex flex-col gap-1">
                        {m.related_questions.map((rq, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAsk(rq)}
                            className="text-left px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-[10px] text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            → {rq}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-indigo-500 font-bold p-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Researching live web & reasoning...</span>
              </div>
            )}
          </div>

          {/* Input Composer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask any question, code, or topic..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
