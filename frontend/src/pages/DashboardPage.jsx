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
import { api } from '../services/api';

export const DashboardPage = ({ onNavigate }) => {
  const { user, currentCourse } = useAuth();
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

  const masteryPercent = 69; // Exactly matching reference design gauge
  const circumference = 2 * Math.PI * 34;
  const strokeDashoffset = circumference - (masteryPercent / 100) * circumference;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in transition-colors duration-200">
      {/* 1. Welcome Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0b10] border border-slate-200/90 dark:border-[#1a1c26] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Alex'}!
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-100/70 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25">
              Active learner
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Today's focus in{' '}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {currentCourse?.title || 'Operating Systems & Concurrency'}
            </span>
            : one quick fix, then you're ahead of plan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('tutor')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span>Ask AI Tutor</span>
          </button>
          <button
            onClick={() => onNavigate('assessment')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece9fe] hover:bg-[#e2dcfe] dark:bg-[#141522] dark:hover:bg-[#1c1e30] text-[#4f46e5] dark:text-indigo-300 text-xs font-semibold border border-[#ddd6fe] dark:border-[#26283d] transition-all cursor-pointer"
          >
            <span>Take diagnostic</span>
          </button>
        </div>
      </div>

      {/* 2. Four Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Circular Course Mastery Ring Gauge */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0a0b10] border border-slate-200/90 dark:border-[#1a1c26] shadow-sm flex items-center gap-4 transition-colors">
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-100 dark:text-[#181a26]"
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
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">69%</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              Course mastery
            </span>
            <span className="inline-block text-[11px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25">
              Proficient
            </span>
          </div>
        </div>

        {/* KPI 2: Study Streak with 7 Segmented Gold Bars */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0a0b10] border border-slate-200/90 dark:border-[#1a1c26] shadow-sm flex flex-col justify-between space-y-3 transition-colors">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Study streak</span>
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

        {/* KPI 3: XP & Rank with Purple Level Pill */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0a0b10] border border-slate-200/90 dark:border-[#1a1c26] shadow-sm flex flex-col justify-between space-y-2.5 transition-colors">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">XP & rank</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">1,795</span>
            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-[#ece9fe] dark:bg-indigo-500/20 text-[#4f46e5] dark:text-indigo-300">
              Level 6
            </span>
          </div>
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#1a1c28] overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full w-[72%]" />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Next rank: [XP target]</span>
          </div>
        </div>

        {/* KPI 4: Spaced Repetition Due Cards */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0a0b10] border border-slate-200/90 dark:border-[#1a1c26] shadow-sm flex flex-col justify-between space-y-2.5 transition-colors">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Spaced repetition</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">3</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">cards due</span>
          </div>
          <button
            onClick={() => onNavigate('flashcards')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Review today's cards →</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom Grid: Recommended Next Action (2 cols) & Why Am I Weak? (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Recommended Next Action */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0a0b10] border border-slate-200/90 dark:border-[#1a1c26] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recommended next action
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded font-mono font-semibold bg-[#ece9fe] dark:bg-indigo-500/15 text-[#4f46e5] dark:text-indigo-300">
              Bayesian engine
            </span>
          </div>

          {/* Prominent Priority Remediation Card */}
          <div className="p-5 rounded-2xl bg-[#f4f5fd] dark:bg-[#10111a] border border-[#e2e5f5] dark:border-[#1f2130] space-y-3 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 block">
                  PRIORITY · DEADLOCK AVOIDANCE
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Master Banker's Algorithm & Safe States
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your last diagnostic mixed up unsafe states with deadlocks. Revisit Slide 18 of Lecture 7, then answer 3 targeted questions.
                </p>
              </div>

              <button
                onClick={() => onNavigate('tutor')}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>Start 5-min remediation →</span>
              </button>
            </div>
          </div>

          {/* 3 Calibrated Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => onNavigate('sources')}
              className="p-4 rounded-xl bg-white dark:bg-[#0e0f17] border border-slate-200/90 dark:border-[#1f2130] hover:border-indigo-400 dark:hover:border-indigo-500/50 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 block">
                STEP 1
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Review slides</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Inspect the Slide 18 resource allocation graph.
              </p>
            </div>

            <div
              onClick={() => onNavigate('assessment')}
              className="p-4 rounded-xl bg-white dark:bg-[#0e0f17] border border-slate-200/90 dark:border-[#1f2130] hover:border-indigo-400 dark:hover:border-indigo-500/50 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 block">
                STEP 2
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Micro quiz</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Three calibrated practice problems.
              </p>
            </div>

            <div
              onClick={() => onNavigate('planner')}
              className="p-4 rounded-xl bg-white dark:bg-[#0e0f17] border border-slate-200/90 dark:border-[#1f2130] hover:border-indigo-400 dark:hover:border-indigo-500/50 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 block">
                STEP 3
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Blitz revision</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                A high-yield 2-hour recap.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1/3: Why Am I Weak? Diagnostic Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0b10] border border-slate-200/90 dark:border-[#1a1c26] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Why am I weak?
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded font-mono font-semibold bg-amber-100/70 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/25">
              Explainable AI
            </span>
          </div>

          {/* Detected Misconception Box */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-[#1b1712] border border-amber-200/80 dark:border-[#382b1c] space-y-1.5 transition-colors">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 block">
              Detected misconception
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
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
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Resource allocation graphs
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    85%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#181a26] overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
                </div>
              </div>

              {/* Gap 2 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Coffman conditions
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    82%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#181a26] overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[82%]" />
                </div>
              </div>

              {/* Gap 3: Weak Prerequisite */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Safe sequences
                  </span>
                  <span className="text-rose-500 dark:text-rose-400 font-bold font-mono">
                    48% · weak
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#181a26] overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full w-[48%]" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('tutor')}
            className="w-full py-2.5 rounded-xl bg-[#ece9fe] hover:bg-[#e2dcfe] dark:bg-[#151624] dark:hover:bg-[#1d1f33] text-[#4f46e5] dark:text-indigo-300 text-xs font-semibold border border-[#ddd6fe] dark:border-[#282a40] transition-all cursor-pointer"
          >
            <span>Explain in Socratic mode →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
