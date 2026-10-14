import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export const DashboardPage = ({ onNavigate, onNavigateWithContext }) => {
  const { user, currentCourse } = useAuth();
  const { themeConfig, isNight } = useTheme();
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [weakAnalysis, setWeakAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user, currentCourse]);

  const loadDashboardData = async () => {
    if (!user || !currentCourse) return;
    try {
      setLoading(true);
      const [profData, recData] = await Promise.all([
        api.getLearnerProfile(user.id).catch(() => null),
        api.getRecommendations(user.id, currentCourse.id).catch(() => null)
      ]);

      setProfile(profData);
      setRecommendations(recData);

      if (recData && recData.weak_topics && recData.weak_topics.length > 0) {
        const weakTopic = recData.weak_topics[0];
        const analysis = await api.getWhyAmIWeak(user.id, weakTopic.id).catch(() => null);
        setWeakAnalysis(analysis);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const storedMastery = typeof window !== 'undefined' ? localStorage.getItem('USER_MASTERY_SCORE') : null;
  const masteryPercent = storedMastery ? Number(storedMastery) : 78;
  const storedQuestions = typeof window !== 'undefined' ? localStorage.getItem('TOTAL_QUESTIONS_EXPLORED') : null;
  const totalQuestionsExplored = storedQuestions ? Number(storedQuestions) : 142;

  let seededSessions = [];
  try {
    const rawSessions = typeof window !== 'undefined' ? localStorage.getItem('STORAGE_KEY_SESSIONS') : null;
    if (rawSessions) {
      seededSessions = JSON.parse(rawSessions);
    }
  } catch (_) {}

  const circumference = 2 * Math.PI * 34;
  const strokeDashoffset = circumference - (masteryPercent / 100) * circumference;

  return (
    <div
      style={{ backgroundColor: themeConfig.bgCanvas }}
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in transition-colors duration-200"
    >
      {/* 1. Welcome Banner matching PDF colors & button arrangements */}
      <div
        style={{
          backgroundColor: themeConfig.bannerBg,
          borderColor: themeConfig.bannerBorder
        }}
        className="p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Alex'}!
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
              Active learner
            </span>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
            Today's focus in{' '}
            <span className="font-bold">
              {currentCourse?.title || 'Operating Systems & Concurrency'}
            </span>
            : one quick fix, then you're ahead of plan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Ask AI Tutor button: Solid dark button as shown in PDF */}
          <button
            onClick={() => onNavigate('tutor')}
            style={{
              backgroundColor: themeConfig.askTutorBtnBg,
              color: themeConfig.askTutorBtnText
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:brightness-110 transition-all cursor-pointer"
          >
            <span>Ask AI Tutor</span>
          </button>

          {/* Take diagnostic button per theme */}
          <button
            onClick={() => onNavigate('assessment')}
            style={{
              backgroundColor: themeConfig.diagnosticBtnBg,
              borderColor: themeConfig.diagnosticBtnBorder
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border text-slate-900 dark:text-white shadow-sm hover:brightness-95 transition-all cursor-pointer"
          >
            <span>Take diagnostic</span>
          </button>
        </div>
      </div>

      {/* 2. Four Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Circular Course Mastery Ring Gauge */}
        <div
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderCard
          }}
          className="p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-colors"
        >
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-100 dark:text-slate-800"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="url(#masteryGradient)"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="masteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">{masteryPercent}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold leading-tight">
              Course<br />mastery
            </span>
            <span className="inline-block text-[11px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
              Proficient
            </span>
          </div>
        </div>

        {/* KPI 2: Study Streak with 7 Segmented Gold Bars */}
        <div
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderCard
          }}
          className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-3 transition-colors"
        >
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Study streak</span>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">7</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">days</span>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">+15% XP boost</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20"
                title={`Day ${i + 1} active`}
              />
            ))}
          </div>
        </div>

        {/* KPI 3: XP & Rank with Theme Pill */}
        <div
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderCard
          }}
          className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-2.5 transition-colors"
        >
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">XP & rank</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">1,795</span>
            <span
              style={{ backgroundColor: themeConfig.remediationBtnBg }}
              className="text-[11px] px-2 py-0.5 rounded font-bold text-slate-950 border border-slate-900/30"
            >
              Level 6
            </span>
          </div>
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full w-[72%]" />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Next rank: [XP target]</span>
          </div>
        </div>

        {/* KPI 4: Spaced Repetition Due Cards */}
        <div
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderCard
          }}
          className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-2.5 transition-colors"
        >
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Spaced repetition</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">3</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">cards due</span>
          </div>
          <button
            onClick={() => onNavigate('flashcards')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Review today's cards →</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom Grid: Recommended Next Action (2 cols) & Why Am I Weak? (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Recommended Next Action */}
        <div
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderCard
          }}
          className="lg:col-span-2 p-6 rounded-2xl border shadow-sm space-y-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Recommended next action
            </h2>
            <span
              style={{ backgroundColor: themeConfig.remediationBtnBg }}
              className="text-[11px] px-2.5 py-0.5 rounded font-mono font-bold text-slate-950 border border-slate-900/30"
            >
              Bayesian engine
            </span>
          </div>

          {/* Prominent Priority Remediation Card */}
          <div
            style={{
              backgroundColor: themeConfig.bgInnerCard,
              borderColor: themeConfig.borderCard
            }}
            className="p-5 rounded-2xl border space-y-3 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 block">
                  PRIORITY · DEADLOCK AVOIDANCE
                </span>
                <h3 className="text-lg font-extrabold text-slate-950 dark:text-white tracking-tight">
                  Master Banker's Algorithm & Safe States
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Your last diagnostic mixed up unsafe states with deadlocks. Revisit Slide 18 of Lecture 7, then answer 3 targeted questions.
                </p>
              </div>

              {/* Start 5-min remediation button with crisp black border as in PDF */}
              <button
                onClick={() => {
                  const remediationContext = {
                    scopedDocument: 'Operating_Systems_Ch7_Deadlocks.pdf',
                    mode: 'exam',
                    initialQuery:
                      "Start a 5-minute targeted remediation on Banker's Algorithm & Safe States: Revisit Slide 18 of Lecture 7, explain the core distinction between an Unsafe State and Deadlock, and guide me through 3 targeted practice questions."
                  };
                  if (onNavigateWithContext) {
                    onNavigateWithContext('tutor', remediationContext);
                  } else {
                    onNavigate('tutor');
                  }
                }}
                style={{ backgroundColor: themeConfig.remediationBtnBg }}
                className="shrink-0 px-4 py-2.5 rounded-xl border-[1.5px] border-slate-900 text-slate-950 font-bold text-xs shadow-sm hover:brightness-95 transition-all cursor-pointer"
              >
                <span>Start 5-min remediation →</span>
              </button>
            </div>
          </div>

          {/* 3 Calibrated Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => {
                if (onNavigateWithContext) {
                  onNavigateWithContext('sources', {
                    document: 'Operating_Systems_Ch7_Deadlocks.pdf',
                    targetPage: 18
                  });
                } else {
                  onNavigate('sources');
                }
              }}
              style={{
                backgroundColor: themeConfig.bgCanvas,
                borderColor: themeConfig.borderCard
              }}
              className="p-4 rounded-xl border hover:border-slate-400 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400 block">
                STEP 1
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Review slides</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Inspect the Slide 18 resource allocation graph.
              </p>
            </div>

            <div
              onClick={() => onNavigate('assessment')}
              style={{
                backgroundColor: themeConfig.bgCanvas,
                borderColor: themeConfig.borderCard
              }}
              className="p-4 rounded-xl border hover:border-slate-400 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400 block">
                STEP 2
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Micro quiz</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Three calibrated practice problems.
              </p>
            </div>

            <div
              onClick={() => onNavigate('planner')}
              style={{
                backgroundColor: themeConfig.bgCanvas,
                borderColor: themeConfig.borderCard
              }}
              className="p-4 rounded-xl border hover:border-slate-400 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 dark:text-slate-400 block">
                STEP 3
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Blitz revision</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                A high-yield 2-hour recap.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1/3: Why Am I Weak? Diagnostic Card */}
        <div
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderCard
          }}
          className="p-6 rounded-2xl border shadow-sm space-y-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Why am I weak?
            </h2>
            <span
              style={{ backgroundColor: themeConfig.coursePillBg }}
              className="text-[11px] px-2.5 py-0.5 rounded font-mono font-bold text-slate-950 border border-slate-900/30"
            >
              Explainable AI
            </span>
          </div>

          {/* Detected Misconception Box */}
          <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-1.5 transition-colors">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
              Detected misconception
            </span>
            <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
              "An unsafe state guarantees immediate deadlock."
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5">
              Seen in 2 diagnostic attempts
            </span>
          </div>

          {/* Prerequisite Gap Tracing Bars */}
          <div className="space-y-3 pt-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Prerequisite gap tracing
            </span>

            <div className="space-y-2.5">
              {/* Gap 1 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Resource allocation graphs
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    85%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
                </div>
              </div>

              {/* Gap 2 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Coffman conditions
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    82%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[82%]" />
                </div>
              </div>

              {/* Gap 3: Weak Prerequisite */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Safe sequences
                  </span>
                  <span className="text-rose-500 dark:text-rose-400 font-bold font-mono">
                    48% · weak
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full w-[48%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Explain in Socratic mode button with crisp black border as in PDF */}
          <button
            onClick={() => onNavigate('tutor')}
            style={{ backgroundColor: themeConfig.socraticBtnBg }}
            className="w-full py-2.5 rounded-xl border-[1.5px] border-slate-900 text-slate-950 font-bold text-xs shadow-sm hover:brightness-95 transition-all cursor-pointer"
          >
            <span>Explain in Socratic mode →</span>
          </button>
        </div>
      </div>

      {/* 4. Seeded Session History & Exploration Milestone (Wow Factor) */}
      {seededSessions && seededSessions.length > 0 && (
        <div
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderCard
          }}
          className="p-6 rounded-2xl border shadow-sm space-y-4 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Recent Adaptive Study Sessions & Mastery History
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
                {totalQuestionsExplored} Questions Explored
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                {masteryPercent}% Global Mastery
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {seededSessions.map((s, idx) => (
              <div
                key={s.id || idx}
                style={{
                  backgroundColor: themeConfig.bgInnerCard,
                  borderColor: themeConfig.borderCard
                }}
                className="p-4 rounded-xl border flex items-center justify-between gap-4 hover:border-indigo-400 transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {s.course}
                    </span>
                    <span className="text-slate-400 text-xs">·</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {s.topic}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block">
                      {s.score}%
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Score</span>
                  </div>
                  <button
                    onClick={() => onNavigate('coding')}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Open in Coding Lab"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
