import React from 'react';
import { Sparkles, Flame, Award, BookOpen, Upload, User, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = ({ onOpenUpload }) => {
  const { user, currentCourse, courses, setCurrentCourse, isDemo } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-slate-200/90 dark:border-[#1a1c26] bg-white/95 dark:bg-black/95 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between transition-colors duration-200">
      {/* Brand & Course */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">EduPath</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                AI
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">Adaptive companion</span>
          </div>
        </div>

        {/* Course Switcher */}
        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-[#1a1c26]">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <select
            value={currentCourse?.id || ''}
            onChange={(e) => {
              const selected = courses.find((c) => c.id === e.target.value);
              if (selected) setCurrentCourse(selected);
            }}
            className="bg-slate-50 hover:bg-slate-100 dark:bg-[#0c0d14] border border-slate-200 dark:border-[#1f2130] text-xs text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer transition-colors"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-[#0c0d14] text-slate-800 dark:text-slate-200">
                {c.code} · {c.title}
              </option>
            ))}
          </select>

          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-sm shadow-indigo-600/20"
              title="Upload PDF, PPTX, MP4, or DOCX"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ingest material</span>
            </button>
          )}
        </div>
      </div>

      {/* Gamification, Theme Toggle & User Profile */}
      <div className="flex items-center gap-3">
        {/* Day / Night Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-[#222436] bg-slate-100/80 hover:bg-slate-200/80 dark:bg-[#12131d] dark:hover:bg-[#1c1e2e] text-slate-700 dark:text-amber-400 text-xs font-semibold transition-all shadow-sm"
          title={isDark ? 'Switch to Day mode' : 'Switch to Night mode'}
          aria-label="Toggle day and night theme"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180" />
              <span className="hidden sm:inline text-slate-300 text-[11px] font-medium">Night</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-slate-700 text-[11px] font-medium">Day</span>
            </>
          )}
        </button>

        {/* Streak Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200/90 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-colors">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
          <span>{user?.profile?.current_streak_days || 7}-day streak</span>
        </div>

        {/* XP & Level */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/90 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors">
          <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Level {user?.profile?.level || 6}</span>
          <span className="text-slate-400 dark:text-slate-600">·</span>
          <span className="font-mono">{user?.profile?.xp_points || 1795} XP</span>
        </div>

        {/* Demo Mode Badge */}
        {isDemo && (
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-medium">
            <ShieldCheck className="w-3 h-3" /> Demo
          </span>
        )}

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-[#1a1c26]">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {user?.full_name
              ? user.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'AR'}
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden lg:inline">
            {user?.full_name || 'Alex Rivera'}
          </span>
        </div>
      </div>
    </header>
  );
};
