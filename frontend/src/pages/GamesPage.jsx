import React, { useState } from 'react';
import {
  Gamepad2,
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';

export const GamesPage = () => {
  const [activeGame, setActiveGame] = useState('match');
  const [score, setScore] = useState(0);

  // Game 1: Term Match State
  const TERMS = [
    { id: '1', term: 'Mutual Exclusion', def: 'At least one resource must be held in non-shareable mode' },
    { id: '2', term: 'Hold and Wait', def: 'Process holds allocated resources while waiting for more' },
    { id: '3', term: 'No Preemption', def: 'Resources cannot be forcefully taken; only voluntarily released' },
    { id: '4', term: 'Circular Wait', def: 'Closed chain of processes each waiting for resource held by next' }
  ];

  const [selectedTerm, setSelectedTerm] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);

  const handleSelectTerm = (t) => {
    setSelectedTerm(t);
  };

  const handleSelectDef = (d) => {
    if (!selectedTerm) return;
    if (selectedTerm.id === d.id) {
      setMatchedPairs(prev => [...prev, d.id]);
      setScore(prev => prev + 50);
      setSelectedTerm(null);
    } else {
      setSelectedTerm(null);
    }
  };

  const resetMatchGame = () => {
    setMatchedPairs([]);
    setSelectedTerm(null);
    setScore(0);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
            Educational Concurrency Mini-Games
          </h2>
          <span className="text-xs text-slate-400">
            Reinforce key mental models through rapid gamified recall
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Score: {score} XP</span>
        </div>
      </div>

      {/* Game Selector Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'match', label: '1. Term Match (Coffman Conditions)' },
          { id: 'order', label: "2. Algorithm Ordering (Banker's)" },
          { id: 'recall', label: '3. Speed Flash Recall' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveGame(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeGame === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Game 1: Term Match */}
      {activeGame === 'match' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Click a term on the left, then click its matching definition on the right:
            </span>
            <button
              onClick={resetMatchGame}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Terms Column */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                Coffman Conditions
              </span>
              {TERMS.map(t => {
                const isMatched = matchedPairs.includes(t.id);
                const isSelected = selectedTerm?.id === t.id;
                return (
                  <button
                    key={t.id}
                    disabled={isMatched}
                    onClick={() => handleSelectTerm(t)}
                    className={`w-full p-4 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isMatched
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 opacity-60'
                        : isSelected
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/40 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{t.term}</span>
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Definitions Column */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                Formal Operating System Definitions
              </span>
              {TERMS.slice().reverse().map(d => {
                const isMatched = matchedPairs.includes(d.id);
                return (
                  <button
                    key={d.id}
                    disabled={isMatched}
                    onClick={() => handleSelectDef(d)}
                    className={`w-full p-4 rounded-xl border text-left text-xs transition-all ${
                      isMatched
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 opacity-60'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{d.def}</span>
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {matchedPairs.length === TERMS.length && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center text-xs font-semibold animate-in fade-in">
              🎉 Congratulations! All 4 Coffman conditions correctly matched. (+200 XP earned!)
            </div>
          )}
        </div>
      )}

      {/* Game 2: Algorithm Ordering */}
      {activeGame === 'order' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Dijkstra's Safety Algorithm Steps</h3>
          <p className="text-xs text-slate-400">
            Review the formal execution sequence of the Banker's safety state test:
          </p>
          <div className="space-y-2">
            {[
              "1. Initialize Work = Available and Finish[i] = False for all i.",
              "2. Find an index i such that Finish[i] == False and Need[i] <= Work.",
              "3. If such an i exists, Work = Work + Allocation[i], Finish[i] = True, and repeat step 2.",
              "4. If Finish[i] == True for all i, then the system is in a Safe State!"
            ].map((step, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-indigo-300">
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game 3: Speed Flash Recall */}
      {activeGame === 'recall' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <Zap className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Rapid-Fire Recall Challenge</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Test your split-second recall on race conditions, mutual exclusion primitives, and cycle detection.
          </p>
          <button
            onClick={() => alert('Speed recall session started!')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
          >
            Start 30-Second Challenge
          </button>
        </div>
      )}
    </div>
  );
};
