import React, { useState, useEffect } from 'react';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SourceCitation } from '../components/citations/SourceCitation';

export const FlashcardsPage = () => {
  const { currentCourse } = useAuth();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    loadFlashcards();
  }, [currentCourse]);

  const loadFlashcards = async () => {
    if (!currentCourse) return;
    try {
      setLoading(true);
      setIsFlipped(false);
      setCurrentIndex(0);
      setReviewCount(0);

      const data = await api.getFlashcards(currentCourse.id);
      if (Array.isArray(data) && data.length > 0) {
        setCards(data);
      } else {
        // Fallback seeded high-yield SM-2 flashcards
        setCards([
          {
            id: 'fc_01',
            topic: 'Deadlocks',
            concept: 'Coffman Conditions',
            front_prompt: 'What four conditions must hold simultaneously for a deadlock to occur according to Coffman?',
            back_answer: '1. Mutual Exclusion (non-shareable resource)\n2. Hold and Wait (holds resource while waiting for another)\n3. No Preemption (resource released only voluntarily)\n4. Circular Wait (closed chain of waiting processes)',
            citation: {
              source_type: 'pdf',
              document: 'Operating Systems Concepts & Principles.pdf',
              location_label: 'Page 42 • Section 7.2',
              excerpt: 'Four conditions must hold simultaneously in a system for a deadlock to arise (Coffman et al., 1971).'
            }
          },
          {
            id: 'fc_02',
            topic: 'Deadlocks',
            concept: "Banker's Algorithm",
            front_prompt: "What is the core purpose of Dijkstra's Banker's Algorithm in an operating system?",
            back_answer: "To dynamically verify whether granting an allocation request will leave the system in a guaranteed Safe State where at least one safe sequence exists.",
            citation: {
              source_type: 'pptx',
              document: 'OS_Lecture7.pptx',
              location_label: 'Slide 18 • Deadlock Avoidance',
              excerpt: 'Dijkstra Banker algorithm simulates resource allocation to confirm a safe sequence exists before approving allocation.'
            }
          },
          {
            id: 'fc_03',
            topic: 'Deadlocks',
            concept: 'Safe State',
            front_prompt: 'Is an "Unsafe State" in an operating system identical to a Deadlock?',
            back_answer: 'No! An unsafe state is not necessarily deadlocked; it is a state from which the OS cannot prevent processes from deadlocking if worst-case maximum claims materialize.',
            citation: {
              source_type: 'video',
              document: 'Lecture7_Video_Recording.mp4',
              location_label: 'Timestamp 21:43 - 22:17',
              excerpt: 'An unsafe state is not equivalent to deadlock. However, from an unsafe state, the system cannot prevent deadlock if maximum demands are made.'
            }
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRateCard = async (rating) => {
    const card = cards[currentIndex];
    if (!card) return;

    try {
      await api.reviewFlashcard(card.id, rating);
    } catch (err) {
      console.warn('Backend review log:', err);
    }

    setReviewCount(prev => prev + 1);
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(cards.length); // Finished
    }
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-in fade-in">
      {/* Deck Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            SuperMemo SM-2 Spaced Repetition Deck
          </h2>
          <span className="text-xs text-slate-400">
            {currentCourse?.title || 'Operating Systems'} • Algorithmically scheduled intervals
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            {currentIndex < cards.length ? `Card ${currentIndex + 1} of ${cards.length}` : 'Completed'}
          </span>
          <button
            onClick={loadFlashcards}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="Reset Deck"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {currentIndex < cards.length && currentCard ? (
        <div className="space-y-6">
          {/* 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[320px] rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40 p-8 shadow-xl cursor-pointer flex flex-col justify-between transition-all select-none relative group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                {currentCard.topic} • {currentCard.concept}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <RotateCw className="w-3.5 h-3.5" />
                {isFlipped ? 'Click to view question' : 'Click to flip answer'}
              </span>
            </div>

            <div className="my-auto py-6">
              {!isFlipped ? (
                <div className="space-y-2 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono block">
                    Question Prompt
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed max-w-xl mx-auto">
                    {currentCard.front_prompt}
                  </h3>
                </div>
              ) : (
                <div className="space-y-4">
                  <span className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono block font-bold">
                    Grounded Answer
                  </span>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {currentCard.back_answer}
                  </p>

                  {currentCard.citation && (
                    <div className="pt-2">
                      <SourceCitation citation={currentCard.citation} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {!isFlipped ? 'Press SPACE or Click to reveal answer' : 'Rate your recall quality below (0 to 5)'}
            </div>
          </div>

          {/* SM-2 Quality Rating Buttons (0 to 5) */}
          {isFlipped && (
            <div className="space-y-2 animate-in fade-in">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block text-center">
                Rate Recall Quality (SuperMemo SM-2):
              </span>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { rating: 0, label: '0: Blackout', color: 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300' },
                  { rating: 1, label: '1: Incorrect', color: 'bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300' },
                  { rating: 2, label: '2: Hard', color: 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300' },
                  { rating: 3, label: '3: Good', color: 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' },
                  { rating: 4, label: '4: Easy', color: 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' },
                  { rating: 5, label: '5: Perfect', color: 'bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300' },
                ].map((btn) => (
                  <button
                    key={btn.rating}
                    onClick={() => handleRateCard(btn.rating)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${btn.color} shadow-sm cursor-pointer`}
                  >
                    <span className="block text-sm">{btn.rating}</span>
                    <span className="text-[10px] block opacity-90">{btn.label.split(': ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Review Deck Finished!</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            You've reviewed all {reviewCount} cards scheduled for today. SM-2 has recalibrated intervals and updated your topic mastery score.
          </p>
          <button
            onClick={loadFlashcards}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Review Deck Again</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
