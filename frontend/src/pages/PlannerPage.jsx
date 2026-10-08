import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Zap,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Flame,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PlannerPage = ({ onNavigateToTopic }) => {
  const { user, currentCourse } = useAuth();
  const [plan, setPlan] = useState(null);
  const [blitzHours, setBlitzHours] = useState(4);
  const [blitzResult, setBlitzResult] = useState(null);
  const [loadingBlitz, setLoadingBlitz] = useState(false);

  useEffect(() => {
    loadPlan();
  }, [user, currentCourse]);

  const loadPlan = async () => {
    if (!user || !currentCourse) return;
    try {
      const data = await api.getStudyPlan(user.id, currentCourse.id);
      setPlan(data);
    } catch (err) {
      console.error('Failed to load study plan:', err);
    }
  };

  const handleGenerateBlitz = async () => {
    if (!currentCourse) return;
    try {
      setLoadingBlitz(true);
      const res = await api.generateBlitzRevision(currentCourse.id, blitzHours);
      setBlitzResult(res);
    } catch (err) {
      console.error('Failed to generate blitz:', err);
    } finally {
      setLoadingBlitz(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in">
      {/* Planner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Adaptive Study Planner & Schedule
          </h2>
          <span className="text-xs text-slate-400">
            {currentCourse?.title || 'Operating Systems'} • Dynamic pacing calibrated to your mastery
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Target Pace:</span>
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
            45 Min / Day
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Schedule & Milestones */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            Today's Scheduled Learning Modules
          </h3>

          <div className="space-y-3">
            {[
              {
                time: '09:00 AM',
                title: 'Review Deadlock Coffman Conditions',
                duration: '15 mins',
                source: 'Operating Systems.pdf • Page 42',
                status: 'COMPLETED'
              },
              {
                time: '11:30 AM',
                title: "Dijkstra's Banker's Algorithm Simulation",
                duration: '20 mins',
                source: 'OS_Lecture7.pptx • Slide 18',
                status: 'IN_PROGRESS'
              },
              {
                time: '04:00 PM',
                title: 'Safe Sequence Diagnostic Quiz & Flashcards',
                duration: '15 mins',
                source: 'Adaptive Spaced Repetition (3 Due)',
                status: 'UPCOMING'
              }
            ].map((task, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                    task.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {task.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{task.title}</h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{task.source}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">{task.duration}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    task.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Yield Blitz Revision Generator */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Blitz Revision Generator
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
              High-Yield
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Short on time before an exam? Select your available study window and generate an emergency high-yield curriculum focused on your weakest concepts.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Available Hours: {blitzHours} Hours
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={blitzHours}
              onChange={(e) => setBlitzHours(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1h (Crash)</span>
              <span>4h (Standard)</span>
              <span>8h (Deep Cram)</span>
            </div>
          </div>

          <button
            onClick={handleGenerateBlitz}
            disabled={loadingBlitz}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loadingBlitz ? 'Synthesizing...' : `Generate ${blitzHours}-Hour Blitz Plan`}</span>
          </button>

          {blitzResult && (
            <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 animate-in fade-in">
              <span className="text-xs font-bold text-indigo-400 block">
                Blitz Curriculum Ready:
              </span>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                <li>Block 1 (45m): Banker's Algorithm Allocation Matrices</li>
                <li>Block 2 (30m): Safe State Sequence Verification</li>
                <li>Block 3 (30m): Resource Allocation Graph Cycles</li>
                <li>Block 4 (15m): 10 Rapid Diagnostic Flashcards</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
