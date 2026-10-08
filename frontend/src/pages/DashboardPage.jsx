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
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user, currentCourse]);

  const loadDashboardData = async () => {
    if (!user || !currentCourse) return;
    try {
      setLoading(true);
      const [profData, recData, timeData] = await Promise.all([
        api.getLearnerProfile(user.id).catch(() => null),
        api.getRecommendations(user.id, currentCourse.id).catch(() => null),
        api.getTimeline(user.id).catch(() => [])
      ]);

      setProfile(profData);
      setRecommendations(recData);
      setTimeline(Array.isArray(timeData) ? timeData : []);

      // If user has weak topics, fetch "Why Am I Weak?" analysis
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

  const masteryPercent = Math.round((profile?.overall_mastery || 0.62) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Alex'}!
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active Learner
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Current Course: <span className="text-indigo-400 font-semibold">{currentCourse?.title || 'Operating Systems & Concurrency'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('tutor')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI Tutor</span>
          </button>
          <button
            onClick={() => onNavigate('assessment')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <span>Take Diagnostic</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Course Mastery */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Course Mastery</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{masteryPercent}%</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-indigo-500/20 text-indigo-300">
              {profile?.status || 'Proficient'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        </div>

        {/* Learning Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Study Streak</span>
            <Flame className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">
              {user?.profile?.current_streak_days || 7} <span className="text-sm font-normal text-slate-400">Days</span>
            </span>
            <span className="text-xs text-amber-400 font-semibold">+15% XP Boost</span>
          </div>
          <p className="text-[11px] text-slate-500">Studied consecutive days with source retrieval.</p>
        </div>

        {/* XP & Level */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Gamified XP & Rank</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{user?.profile?.xp_points || 1240}</span>
            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-indigo-500/20 text-indigo-300">
              Level {user?.profile?.level || 4}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Next rank unlocks at 1,500 XP.</p>
        </div>

        {/* Due Flashcards */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SM-2 Spaced Repetition</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">3</span>
            <span className="text-xs text-sky-400 font-semibold">Cards Due</span>
          </div>
          <button
            onClick={() => onNavigate('flashcards')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Review Today's Cards</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Adaptive Recommendation & "Why Am I Weak?" Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Best Action Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Recommended Next Best Action
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Dynamic Bayesian Engine
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
                Priority Concept: Deadlock Avoidance
              </span>
              <h3 className="text-base font-bold text-slate-100">
                Master Dijkstra's Banker's Algorithm & Safe States
              </h3>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Your last diagnostic detected confusion between Unsafe States and Deadlocks. Revisit Slide 18 of Lecture 7 and practice 3 targeted questions to secure prerequisite proficiency.
              </p>
            </div>

            <button
              onClick={() => onNavigate('tutor')}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-2"
            >
              <span>Start 5-Min Remediation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Action Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div
              onClick={() => onNavigate('sources')}
              className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 cursor-pointer space-y-1 transition-all"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>1. Review Slides</span>
              </div>
              <p className="text-[11px] text-slate-500">Inspect Slide 18 resource allocation graph.</p>
            </div>

            <div
              onClick={() => onNavigate('assessment')}
              className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 cursor-pointer space-y-1 transition-all"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Micro Quiz</span>
              </div>
              <p className="text-[11px] text-slate-500">Attempt 3 calibrated practice problems.</p>
            </div>

            <div
              onClick={() => onNavigate('planner')}
              className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 cursor-pointer space-y-1 transition-all"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Blitz Revision</span>
              </div>
              <p className="text-[11px] text-slate-500">Generate high-yield 2-hour recap.</p>
            </div>
          </div>
        </div>

        {/* "Why Am I Weak?" Explainable Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Why Am I Weak?
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Explainable AI
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="font-semibold text-amber-300 block mb-1">
                Detected Misconception:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                "Belief that an Unsafe State guarantees immediate deadlock." (Occurred in 2 diagnostic attempts)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs space-y-2">
              <span className="font-semibold text-slate-300 block">Prerequisite Gap Tracing:</span>
              <div className="space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Resource Allocation Graphs</span>
                  <span className="text-emerald-400 font-mono">85% Mastered</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Coffman Conditions</span>
                  <span className="text-emerald-400 font-mono">82% Mastered</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Safe Sequences</span>
                  <span className="text-amber-400 font-mono font-bold">48% Weak</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('tutor')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <span>Explain in Socratic Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
