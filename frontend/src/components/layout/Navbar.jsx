import React, { useState } from 'react';
import { Sparkles, Flame, Award, BookOpen, Upload, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onOpenUpload }) => {
  const { user, currentCourse, courses, setCurrentCourse, isDemo } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Course */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">EduPath</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                AI
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Multimodal Adaptive Companion</span>
          </div>
        </div>

        {/* Course Switcher */}
        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <select
            value={currentCourse?.id || ''}
            onChange={(e) => {
              const selected = courses.find(c => c.id === e.target.value);
              if (selected) setCurrentCourse(selected);
            }}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>

          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm"
              title="Upload PDF, PPTX, MP4, or DOCX"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ingest Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Gamification & User Stats */}
      <div className="flex items-center gap-4">
        {/* Streak Counter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
          <span>{user?.profile?.current_streak_days || 7} Days</span>
        </div>

        {/* XP & Level */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Award className="w-4 h-4 text-indigo-400" />
          <span>Level {user?.profile?.level || 4}</span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-indigo-200">{user?.profile?.xp_points || 1240} XP</span>
        </div>

        {/* Demo Mode Badge */}
        {isDemo && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
            <ShieldCheck className="w-3 h-3" /> Demo Learner
          </span>
        )}

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-slate-300" />
            )}
          </div>
          <span className="text-xs font-medium text-slate-300 hidden lg:inline">
            {user?.full_name || 'Alex Rivera'}
          </span>
        </div>
      </div>
    </header>
  );
};
