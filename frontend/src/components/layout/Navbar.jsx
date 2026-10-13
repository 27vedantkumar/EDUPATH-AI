import React, { useState } from 'react';
import { Sparkles, Flame, Award, BookOpen, Upload, User, ShieldCheck, Sun, Moon, Palette } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = ({ onOpenUpload }) => {
  const { user, currentCourse, courses, setCurrentCourse, isDemo } = useAuth();
  const { theme, themeConfig, isNight, toggleDayNight, setTheme, themes } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

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

        {/* User Avatar Circle */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-[#fca5a5] text-slate-950 font-bold text-xs flex items-center justify-center border border-slate-900 shadow-sm">
            AR
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-200 hidden lg:inline">
            Alex Rivera
          </span>
        </div>
      </div>
    </header>
  );
};
