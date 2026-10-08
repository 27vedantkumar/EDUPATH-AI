import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  BookOpen,
  RefreshCw,
  Award,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SourceCitation } from '../components/citations/SourceCitation';

export const AssessmentsPage = ({ onAskTutorAboutMistake }) => {
  const { user, currentCourse } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [showWhyWrongModal, setShowWhyWrongModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scoreCount, setScoreCount] = useState(0);

  useEffect(() => {
    loadQuestions();
  }, [currentCourse]);

  const loadQuestions = async () => {
    if (!currentCourse) return;
    try {
      setLoading(true);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsSubmitted(false);
      setEvaluationResult(null);
      setScoreCount(0);

      const data = await api.getPracticeQuestions(currentCourse.id, 'Deadlocks');
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
      } else {
        // High-quality fallback calibrated diagnostic questions
        setQuestions([
          {
            id: 'q_01',
            topic: 'Deadlocks',
            concept: 'Coffman Conditions',
            question: 'Which of the following conditions is NOT required for a deadlock to occur?',
            options: [
              { id: 'A', text: 'Mutual Exclusion' },
              { id: 'B', text: 'Preemption of Allocated Resources' },
              { id: 'C', text: 'Hold and Wait' },
              { id: 'D', text: 'Circular Wait' }
            ],
            correct_option: 'B',
            explanation: 'The four Coffman conditions require No Preemption. If resources can be preempted, deadlock cannot form.',
            misconception: 'Bypassing mutual exclusion or confusing preemption with deadlock recovery.',
            citation: {
              source_type: 'pdf',
              document: 'Operating Systems Concepts & Principles.pdf',
              location_label: 'Page 42, Section 7.2',
              excerpt: 'No Preemption: Resources cannot be preempted; that is, a resource can be released only voluntarily by the holding process.'
            }
          },
          {
            id: 'q_02',
            topic: 'Deadlocks',
            concept: 'Safe State',
            question: 'If a system is currently in an "Unsafe State", which statement is technically true?',
            options: [
              { id: 'A', text: 'The system is already in a deadlock.' },
              { id: 'B', text: 'The system cannot guarantee deadlock avoidance if worst-case requests occur, but is not deadlocked yet.' },
              { id: 'C', text: 'All processes must be terminated immediately.' },
              { id: 'D', text: 'Available resources exceed total maximum demand.' }
            ],
            correct_option: 'B',
            explanation: 'An unsafe state is not deadlock; it merely means the OS cannot prevent processes from deadlocking if worst-case claims materialize.',
            misconception: 'Equates Unsafe State directly with Deadlock.',
            citation: {
              source_type: 'pptx',
              document: 'OS_Lecture7.pptx',
              location_label: 'Slide 18: Resource Graphs',
              excerpt: 'An unsafe state is not equivalent to a deadlock. However, from an unsafe state, the system cannot prevent deadlock if maximum demands are made.'
            }
          },
          {
            id: 'q_03',
            topic: 'Deadlocks',
            concept: "Banker's Algorithm",
            question: "Before Dijkstra's Banker's Algorithm grants a resource request, what condition must be validated?",
            options: [
              { id: 'A', text: 'Round-Robin quantum expiration' },
              { id: 'B', text: 'Existence of at least one Safe Sequence for all active processes' },
              { id: 'C', text: 'Page table hash consistency' },
              { id: 'D', text: 'Direct cache hit ratio exceeding 90%' }
            ],
            correct_option: 'B',
            explanation: "Banker's Algorithm simulates the allocation and checks whether a complete safe sequence <P1, P2, ... Pn> remains.",
            misconception: 'Confuses CPU scheduling or virtual memory paging with resource allocation avoidance.',
            citation: {
              source_type: 'video',
              document: 'Lecture7_Video_Recording.mp4',
              location_label: 'Timestamp 22:17 - 23:05',
              excerpt: 'Notice how Dijkstra evaluates Allocation, Max, and Available matrices to guarantee a safe sequence before approving the request.'
            }
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optId) => {
    if (isSubmitted) return;
    setSelectedOption(optId);
  };

  const currentQ = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQ) return;

    setIsSubmitted(true);
    const isCorrect = selectedOption === currentQ.correct_option;
    if (isCorrect) {
      setScoreCount(prev => prev + 1);
    }

    try {
      const res = await api.evaluateAssessment({
        user_id: user?.id || 'demo-user-1',
        course_id: currentCourse?.id || 'OS_101',
        question_id: currentQ.id,
        topic_name: currentQ.topic,
        concept_name: currentQ.concept,
        selected_option: selectedOption,
        correct_option: currentQ.correct_option,
        is_correct: isCorrect
      });
      setEvaluationResult(res);
    } catch (err) {
      setEvaluationResult({
        is_correct: isCorrect,
        mastery_delta: isCorrect ? 0.08 : -0.04,
        new_mastery: isCorrect ? 0.70 : 0.48
      });
    }

    if (!isCorrect) {
      setShowWhyWrongModal(true);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
      setEvaluationResult(null);
      setShowWhyWrongModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in">
      {/* Assessment Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            Adaptive Diagnostic & Calibration Quiz
          </h2>
          <span className="text-xs text-slate-400">
            Topic: <strong className="text-slate-200">{currentQ?.topic || 'Deadlocks'}</strong> • Concept: <strong className="text-indigo-400">{currentQ?.concept || "Banker's Algorithm"}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <button
            onClick={loadQuestions}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Reset Quiz"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {currentQ && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
              Multiple Choice Problem
            </span>
            <h3 className="text-base font-semibold text-white leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isCorrect = opt.id === currentQ.correct_option;
              let btnClass = 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-950/80';

              if (isSubmitted) {
                if (isCorrect) {
                  btnClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
                } else if (isSelected && !isCorrect) {
                  btnClass = 'border-rose-500 bg-rose-500/10 text-rose-300';
                }
              } else if (isSelected) {
                btnClass = 'border-indigo-500 bg-indigo-600/20 text-white shadow-sm';
              }

              return (
                <button
                  key={opt.id}
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs transition-all ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-slate-200 shrink-0">
                      {opt.id}
                    </span>
                    <span>{opt.text}</span>
                  </div>

                  {isSubmitted && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {isSubmitted && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Submission and Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {!isSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedOption}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all ml-auto"
              >
                Submit Answer
              </button>
            ) : (
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedOption === currentQ.correct_option ? (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Correct! Mastery increased +8%
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowWhyWrongModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Why Was I Wrong?</span>
                    </button>
                  )}
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="text-xs font-semibold text-indigo-400">
                    Quiz Complete! Score: {scoreCount} / {questions.length}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* "Why Was I Wrong?" Diagnostic Modal */}
      {showWhyWrongModal && currentQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Why Was I Wrong? Diagnostic Analysis</h3>
              </div>
              <button
                onClick={() => setShowWhyWrongModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            {/* Misconception Card */}
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
              <span className="text-[11px] font-bold text-rose-400 block uppercase tracking-wider">
                Detected Cognitive Misconception:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                "{currentQ.misconception || 'Confuses potential deadlock states with actual deadlock execution.'}"
              </p>
            </div>

            {/* Explanation & Remediation */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <span className="font-bold text-white block">Explanation & Grounded Proof:</span>
              <p className="text-slate-400 leading-relaxed font-sans">
                {currentQ.explanation}
              </p>
            </div>

            {/* Source Evidence Citation */}
            {currentQ.citation && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-indigo-400 block">Course Source Evidence:</span>
                <SourceCitation citation={currentQ.citation} />
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowWhyWrongModal(false);
                  if (onAskTutorAboutMistake) onAskTutorAboutMistake(currentQ);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain in Socratic Tutor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
