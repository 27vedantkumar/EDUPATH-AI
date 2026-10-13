import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ExamPage = () => {
  const { currentCourse } = useAuth();
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [examResults, setExamResults] = useState(null);

  const EXAM_QUESTIONS = [
    {
      id: 'eq_1',
      topic: 'Deadlocks',
      concept: 'Coffman Conditions',
      question: 'Which of the following describes the "Circular Wait" condition formally?',
      options: [
        { id: 'A', text: 'Processes release all held resources before requesting new ones.' },
        { id: 'B', text: 'A closed chain P0...Pn exists where P0 waits for P1, and Pn waits for P0.' },
        { id: 'C', text: 'Preemption of resources is enforced by the operating system kernel.' },
        { id: 'D', text: 'Only one process can execute in memory at any given time.' }
      ],
      correct_option: 'B',
      explanation: 'Circular wait is a closed directed cycle of waiting processes.'
    },
    {
      id: 'eq_2',
      topic: 'Deadlocks',
      concept: 'Safe State',
      question: 'Under what condition does a system state qualify as formally Safe?',
      options: [
        { id: 'A', text: 'Zero processes are currently requesting I/O devices.' },
        { id: 'B', text: 'At least one Safe Sequence of processes exists.' },
        { id: 'C', text: 'All available resources are currently idle.' },
        { id: 'D', text: 'CPU utilization exceeds 95%.' }
      ],
      correct_option: 'B',
      explanation: 'A state is safe only if there exists at least one valid safe sequence.'
    },
    {
      id: 'eq_3',
      topic: 'Deadlocks',
      concept: "Banker's Algorithm",
      question: 'What matrix data structures are utilized in Dijkstra\'s Banker\'s Algorithm?',
      options: [
        { id: 'A', text: 'Adjacency matrix, Incidence matrix, Laplacian matrix' },
        { id: 'B', text: 'Available, Max, Allocation, Need' },
        { id: 'C', text: 'Page directory, Page table, TLB, Swap space' },
        { id: 'D', text: 'Inverted page table, Segment table, Frame table' }
      ],
      correct_option: 'B',
      explanation: "Banker's Algorithm strictly tracks Available[m], Max[n,m], Allocation[n,m], and Need[n,m]."
    }
  ];

  useEffect(() => {
    let timer;
    if (examStarted && !isSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, isSubmitted, timeLeft]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (optId) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: optId
    }));
  };

  const handleSubmitExam = () => {
    setIsSubmitted(true);
    let correct = 0;
    EXAM_QUESTIONS.forEach((q, idx) => {
      if (answers[idx] === q.correct_option) {
        correct++;
      }
    });
    const scorePct = Math.round((correct / EXAM_QUESTIONS.length) * 100);
    setExamResults({
      correct,
      total: EXAM_QUESTIONS.length,
      scorePct,
      readiness: scorePct >= 80 ? 'High Readiness (Exam Ready)' : scorePct >= 50 ? 'Moderate Readiness' : 'Needs Review'
    });
  };

  const currentQ = EXAM_QUESTIONS[currentIndex];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in">
      {/* Exam Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Midterm Exam Simulator
          </h2>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {currentCourse?.title || 'Operating Systems'} • Strict time constraint simulation
          </span>
        </div>

        {examStarted && !isSubmitted && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-mono text-sm font-bold animate-pulse">
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeft)}</span>
          </div>
        )}
      </div>

      {!examStarted ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready for the Exam Simulation?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This simulator mimics real midterm exam conditions. You have 15 minutes to solve calibrated multiple choice problems spanning Coffman conditions, Safe States, and Banker's Algorithm.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs font-medium text-slate-700 dark:text-slate-300">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="block font-bold text-slate-900 dark:text-white">3</span> Questions
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="block font-bold text-slate-900 dark:text-white">15</span> Minutes
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="block font-bold text-slate-900 dark:text-white">80%</span> Target Pass
            </div>
          </div>

          <button
            onClick={() => {
              setExamStarted(true);
              setTimeLeft(900);
            }}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
          >
            Start Exam Timer
          </button>
        </div>
      ) : !isSubmitted ? (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Question Navigation Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              {EXAM_QUESTIONS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentIndex === idx
                      ? 'bg-indigo-600 text-white'
                      : answers[idx]
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400">
              Answered {Object.keys(answers).length} of {EXAM_QUESTIONS.length}
            </span>
          </div>

          {/* Current Question */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </h3>

            <div className="space-y-2">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentIndex] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectAnswer(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-950 dark:text-white ring-1 ring-indigo-500 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 text-slate-800 dark:text-slate-300 hover:border-indigo-400 hover:bg-white dark:hover:bg-slate-950/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-mono font-bold text-slate-900 dark:text-slate-200 shrink-0">
                        {opt.id}
                      </span>
                      <span className="leading-relaxed">{opt.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>

            {currentIndex < EXAM_QUESTIONS.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md cursor-pointer"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Results Card */
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Exam Simulation Complete!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Readiness: <strong className="text-indigo-600 dark:text-indigo-400">{examResults?.readiness}</strong></p>
          </div>

          <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
            {examResults?.scorePct}%
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              Correct: <span className="text-emerald-600 dark:text-emerald-400">{examResults?.correct}</span> / {examResults?.total}
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              XP Earned: <span className="text-indigo-600 dark:text-indigo-400">+120 XP</span>
            </div>
          </div>

          <button
            onClick={() => {
              setExamStarted(false);
              setIsSubmitted(false);
              setAnswers({});
            }}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer"
          >
            Retake Exam Simulation
          </button>
        </div>
      )}
    </div>
  );
};
