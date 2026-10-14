import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Award, BookOpen, Upload, User, ShieldCheck, Sun, Moon, Palette, LogOut, CheckCircle2, Key, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { generateLiveResponse } from '../../services/aiOrchestrator';

export const Navbar = ({ onOpenUpload }) => {
  const { user, currentCourse, courses, setCurrentCourse, isDemo, logout } = useAuth();
  const { theme, themeConfig, isNight, toggleDayNight, setTheme, themes } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('GEMINI_API_KEY');
    setHasApiKey(Boolean(key));
    if (key) setApiKeyInput(key);
  }, [showApiKeyModal]);

  return (
    <header
      style={{
        backgroundColor: themeConfig.bgCanvas,
        borderColor: themeConfig.borderCard
      }}
      className="h-16 border-b backdrop-blur sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200"
    >
      {/* Brand & Course Pill & Ingest Material */}
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">EduPath</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                AI
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">Adaptive companion</span>
          </div>
        </div>

        {/* Course Switcher Pill with crisp border as shown in PDF */}
        <div className="hidden md:flex items-center gap-2 pl-2">
          <div
            style={{ backgroundColor: themeConfig.coursePillBg }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-[1.5px] border-slate-900 shadow-sm"
          >
            <select
              value={currentCourse?.id || ''}
              onChange={(e) => {
                const selected = courses.find((c) => c.id === e.target.value);
                if (selected) setCurrentCourse(selected);
              }}
              style={{ backgroundColor: 'transparent' }}
              className="text-xs text-slate-950 font-bold outline-none cursor-pointer pr-1"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#161932] text-slate-900 dark:text-white font-medium">
                  {c.code} · {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Ingest Material Pill with crisp border as shown in PDF */}
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              style={{ backgroundColor: themeConfig.ingestBtnBg }}
              className="flex items-center gap-1 text-xs px-3.5 py-1.5 rounded-xl border-[1.5px] border-slate-900 text-slate-950 font-bold hover:brightness-95 transition-all shadow-sm cursor-pointer"
              title="Upload PDF, PPTX, MP4, or DOCX"
            >
              <span>Ingest material</span>
            </button>
          )}
        </div>
      </div>

      {/* Gamification, 4-Theme Selector & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Gemini API Key Gateway Modal Trigger */}
        <button
          onClick={() => {
            setTestResult('');
            setShowApiKeyModal(true);
          }}
          style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold text-slate-800 dark:text-slate-200 hover:brightness-95 shadow-sm transition-all cursor-pointer"
          title="Configure Google Gemini Live API Key (or offline fallback)"
        >
          <Key className={`w-3.5 h-3.5 ${hasApiKey ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className="hidden sm:inline text-[11px] font-bold">
            {hasApiKey ? 'Gemini 1.5' : 'AI Gateway'}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-amber-400 animate-pulse'}`} />
        </button>

        {/* 4-Theme Mode Selector (2 Day + 2 Night) */}
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold text-slate-800 dark:text-slate-200 hover:brightness-95 shadow-sm transition-all"
            title="Choose Theme: 2 Day & 2 Night options"
          >
            <span className="text-sm">{themeConfig.icon}</span>
            <span className="hidden sm:inline text-[11px] font-bold">{themeConfig.label}</span>
            <span className="text-[10px] text-slate-400">▾</span>
          </button>

          {showThemePicker && (
            <div
              style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
              className="absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1.5"
            >
              <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                ☀️ 2 Day Themes
              </div>
              <button
                onClick={() => {
                  setTheme('day-peach');
                  setShowThemePicker(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  theme === 'day-peach'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🍑</span>
                  <span>Peach (Day 1)</span>
                </div>
                <span className="w-3 h-3 rounded-full bg-[#fed8cd] border border-slate-900" />
              </button>
              <button
                onClick={() => {
                  setTheme('day-rose');
                  setShowThemePicker(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  theme === 'day-rose'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🌸</span>
                  <span>Rose (Day 2)</span>
                </div>
                <span className="w-3 h-3 rounded-full bg-[#fdd9e0] border border-slate-900" />
              </button>

              <div className="px-2 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-t border-slate-100 dark:border-slate-800">
                🌙 2 Night Themes
              </div>
              <button
                onClick={() => {
                  setTheme('night-indigo');
                  setShowThemePicker(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  theme === 'night-indigo'
                    ? 'bg-indigo-950 text-indigo-200 border border-indigo-700'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🌌</span>
                  <span>Indigo (Night 1)</span>
                </div>
                <span className="w-3 h-3 rounded-full bg-[#818cf8] border border-slate-900" />
              </button>
              <button
                onClick={() => {
                  setTheme('night-emerald');
                  setShowThemePicker(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  theme === 'night-emerald'
                    ? 'bg-emerald-950 text-emerald-200 border border-emerald-700'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🌿</span>
                  <span>Emerald (Night 2)</span>
                </div>
                <span className="w-3 h-3 rounded-full bg-[#5eead4] border border-slate-900" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Day / Night Toggle Switch */}
        <button
          onClick={toggleDayNight}
          style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
          className="flex items-center justify-center w-8 h-8 rounded-full border shadow-sm text-slate-800 dark:text-amber-400 hover:brightness-95 transition-all"
          title={isNight ? 'Switch to Day mode' : 'Switch to Night mode'}
          aria-label="Toggle Day / Night"
        >
          {isNight ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* 7-day streak pill */}
        <div
          style={{ backgroundColor: themeConfig.coursePillBg }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-slate-950 text-xs font-bold shadow-sm"
        >
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
          <span>7-day streak</span>
        </div>

        {/* Level & XP pill */}
        <div
          style={{
            backgroundColor: themeConfig.remediationBtnBg
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-slate-950 text-xs font-bold shadow-sm"
        >
          <span>Level 6 · 1, 795 XP</span>
        </div>

        {/* User Profile & Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-1 cursor-pointer focus:outline-none group"
            title="Account & Session Menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#fca5a5] text-slate-950 font-bold text-xs flex items-center justify-center border border-slate-900 shadow-sm group-hover:scale-105 transition-transform">
              {(() => {
                const name = user?.full_name || user?.name || (isDemo ? 'Alex Rivera' : 'Learner');
                const parts = name.trim().split(/\s+/);
                return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
              })()}
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200 hidden lg:inline">
              {user?.full_name || user?.name || (isDemo ? 'Alex Rivera' : 'Learner')}
            </span>
          </button>

          {showProfileMenu && (
            <div
              style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
              className="absolute right-0 mt-2 w-72 rounded-2xl border shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-3"
            >
              {/* Header profile info */}
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-[#fca5a5] text-slate-950 font-bold text-sm flex items-center justify-center border border-slate-900 shadow-sm flex-shrink-0">
                  {(() => {
                    const name = user?.full_name || user?.name || (isDemo ? 'Alex Rivera' : 'Learner');
                    const parts = name.trim().split(/\s+/);
                    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.full_name || user?.name || (isDemo ? 'Alex Rivera' : 'Learner')}
                    </p>
                    {(user?.email_verified_at || isDemo) && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || (isDemo ? 'alex.rivera@stanford.edu' : '')}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {isDemo ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        ⚡ Hackathon Judge Mode
                      </span>
                    ) : user?.email_verified_at ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        ✓ Verified Account
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Course:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{currentCourse?.code || 'CS301'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Auth Method:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{isDemo ? '1-Click Evaluator' : 'Secure Email Cookie'}</span>
                </div>
              </div>

              {/* Sign out button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gemini API Key Gateway Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 text-slate-900 dark:text-white"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">Live LLM API Gateway</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Google Gemini 1.5 Flash</span>
                </div>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Gateway Status:</span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                  hasApiKey
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {hasApiKey ? '● Live Gemini Active' : '○ Offline Prototype Mode'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const trimmed = apiKeyInput.trim();
                    if (trimmed) {
                      localStorage.setItem('GEMINI_API_KEY', trimmed);
                      setHasApiKey(true);
                    } else {
                      localStorage.removeItem('GEMINI_API_KEY');
                      setHasApiKey(false);
                    }
                    setTestResult('Key saved to localStorage successfully.');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Key</span>
                </button>

                {hasApiKey && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('GEMINI_API_KEY');
                      setApiKeyInput('');
                      setHasApiKey(false);
                      setTestResult('Key removed. Reverted to local prototype mode.');
                    }}
                    className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                <button
                  disabled={isTesting}
                  onClick={async () => {
                    setIsTesting(true);
                    setTestResult('Calling generateLiveResponse()...');
                    try {
                      const res = await generateLiveResponse('Hello! Test connection.', 'You are an expert tutor.');
                      setTestResult(res);
                    } catch (err) {
                      setTestResult('Error: ' + err.message);
                    } finally {
                      setIsTesting(false);
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Test Gateway</span>
                </button>
              </div>

              {testResult && (
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] max-h-36 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                  {testResult}
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>💡 Evaluator Quick Tip:</span>
                </p>
                <p>
                  You can also paste your key directly in Chrome DevTools:
                </p>
                <code className="block bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                  localStorage.setItem('GEMINI_API_KEY', 'your_actual_key')
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
