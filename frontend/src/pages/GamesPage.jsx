import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Zap,
  ArrowRight,
  ArrowLeft,
  Bug,
  Terminal,
  Grid,
  Swords,
  Compass,
  Keyboard,
  Cpu,
  Search,
  Crown,
  Timer,
  Flame,
  Volume2,
  Play
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const GamesPage = ({ onAskTutor }) => {
  const { themeConfig, isNight } = useTheme();
  const { user } = useAuth();

  const [activeGame, setActiveGame] = useState(null); // null = Arcade Menu, or game id
  const [totalXp, setTotalXp] = useState(1240);
  const [sessionScore, setSessionScore] = useState(0);

  // 10 Games Definition matching user screenshots
  const ARCADE_GAMES = [
    {
      id: 'code_rush',
      title: 'Code Rush',
      tag: 'SPEED',
      tagColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      description: 'Speed trivia against clock',
      icon: Zap,
      iconColor: 'text-amber-400'
    },
    {
      id: 'bug_hunter',
      title: 'Bug Hunter',
      tag: 'DEBUGGING',
      tagColor: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
      description: 'Spot syntax & logical bugs',
      icon: Bug,
      iconColor: 'text-rose-400'
    },
    {
      id: 'output_predictor',
      title: 'Output Predictor',
      tag: 'LOGIC',
      tagColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      description: 'Mentally execute code',
      icon: Terminal,
      iconColor: 'text-emerald-400'
    },
    {
      id: 'memory_match',
      title: 'Memory Match',
      tag: 'RECALL',
      tagColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
      description: 'Concept definition tiles',
      icon: Grid,
      iconColor: 'text-blue-400'
    },
    {
      id: 'flashcard_battle',
      title: 'Flashcard Battle',
      tag: 'SPEED',
      tagColor: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
      description: 'Rapid combo multiplier',
      icon: Swords,
      iconColor: 'text-purple-400'
    },
    {
      id: 'algorithm_maze',
      title: 'Algorithm Maze',
      tag: 'ADVENTURE',
      tagColor: 'bg-teal-500/15 text-teal-500 border-teal-500/30',
      description: 'CS question maze',
      icon: Compass,
      iconColor: 'text-teal-400'
    },
    {
      id: 'typing_code',
      title: 'Typing Code',
      tag: 'TYPING',
      tagColor: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
      description: 'WPM and syntax test',
      icon: Keyboard,
      iconColor: 'text-cyan-400'
    },
    {
      id: 'binary_battle',
      title: 'Binary Battle',
      tag: 'ARCHITECTURE',
      tagColor: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30',
      description: 'Number system conversion',
      icon: Cpu,
      iconColor: 'text-indigo-400'
    },
    {
      id: 'sql_detective',
      title: 'SQL Detective',
      tag: 'SQL',
      tagColor: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
      description: 'Solve murder mystery via SQL',
      icon: Search,
      iconColor: 'text-orange-400'
    },
    {
      id: 'quiz_boss',
      title: 'AI Quiz Boss',
      tag: 'BOSS RAID',
      tagColor: 'bg-red-500/15 text-red-500 border-red-500/30',
      description: 'RPG boss fight with HP bars',
      icon: Crown,
      iconColor: 'text-red-400'
    }
  ];

  // ==========================================
  // GAME STATES
  // ==========================================

  // Game 1: Code Rush State
  const [rushIdx, setRushIdx] = useState(0);
  const [rushScore, setRushScore] = useState(0);
  const [rushTimer, setRushTimer] = useState(25);
  const [rushFinished, setRushFinished] = useState(false);
  const RUSH_QUESTIONS = [
    {
      q: 'What is the worst-case time complexity of QuickSort?',
      options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(log N)'],
      ans: 1,
      expl: 'Degrades to O(N^2) when bad pivots are selected (e.g. sorted arrays).'
    },
    {
      q: 'Which data structure enforces Last-In, First-Out (LIFO)?',
      options: ['Queue', 'Stack', 'Min-Heap', 'Circular Buffer'],
      ans: 1,
      expl: 'Stacks enforce LIFO access order.'
    },
    {
      q: 'Which Coffman condition is eliminated by total resource ordering?',
      options: ['Mutual Exclusion', 'Hold and Wait', 'Circular Wait', 'No Preemption'],
      ans: 2,
      expl: 'Strict resource hierarchy prevents circular waiting chains.'
    },
    {
      q: 'What is the HTTP code for Unauthorized Authentication?',
      options: ['200', '401', '403', '500'],
      ans: 1,
      expl: '401 indicates unauthenticated; 403 indicates authenticated but forbidden.'
    }
  ];

  useEffect(() => {
    let interval = null;
    if (activeGame === 'code_rush' && !rushFinished && rushTimer > 0) {
      interval = setInterval(() => setRushTimer((t) => t - 1), 1000);
    } else if (rushTimer === 0 && activeGame === 'code_rush') {
      setRushFinished(true);
    }
    return () => clearInterval(interval);
  }, [activeGame, rushFinished, rushTimer]);

  const handleRushAnswer = (choiceIdx) => {
    if (choiceIdx === RUSH_QUESTIONS[rushIdx].ans) {
      setRushScore((s) => s + 50);
      setSessionScore((s) => s + 50);
    }
    if (rushIdx + 1 < RUSH_QUESTIONS.length) {
      setRushIdx((i) => i + 1);
    } else {
      setRushFinished(true);
    }
  };

  // Game 2: Bug Hunter State
  const [bugIdx, setBugIdx] = useState(0);
  const [bugSelectedLine, setBugSelectedLine] = useState(null);
  const [bugFeedback, setBugFeedback] = useState(null);
  const BUG_CHALLENGES = [
    {
      title: 'Off-By-One Boundary Error',
      lines: [
        'def compute_averages(data):',
        '    total = 0',
        '    for i in range(0, len(data) + 1):  # Error here',
        '        total += data[i]',
        '    return total / len(data)'
      ],
      bugLine: 2,
      fix: 'range(0, len(data)) avoids IndexError at data[len(data)]'
    },
    {
      title: 'Mutable Default Argument',
      lines: [
        'def register_player(name, inventory=[]):',
        '    inventory.append(name)',
        '    return inventory'
      ],
      bugLine: 0,
      fix: 'Use inventory=None and assign [] inside to avoid shared state across calls'
    }
  ];

  // Game 3: Output Predictor State
  const [outIdx, setOutIdx] = useState(0);
  const [outFeedback, setOutFeedback] = useState(null);
  const OUTPUT_PUZZLES = [
    {
      code: 'a = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a))',
      options: ['3', '4', 'Error', 'None'],
      correct: '4',
      expl: 'Both references point to the exact same list in heap memory.'
    },
    {
      code: 'print(2 ** 3 ** 2)',
      options: ['64', '512', '72', '256'],
      correct: '512',
      expl: 'Exponentiation operator ** associates from right-to-left: 2 ** (3 ** 2) = 2 ** 9 = 512.'
    }
  ];

  // Game 4: Memory Match State
  const MEMORY_TILES = [
    { id: '1', label: 'Mutual Exclusion', pair: 'A' },
    { id: '2', label: 'At least one resource is held non-shareable', pair: 'A' },
    { id: '3', label: 'Hold and Wait', pair: 'B' },
    { id: '4', label: 'Thread holds resources while awaiting more', pair: 'B' },
    { id: '5', label: 'Semaphore', pair: 'C' },
    { id: '6', label: 'Integer primitive for thread synchronization', pair: 'C' },
    { id: '7', label: 'Banker’s Algorithm', pair: 'D' },
    { id: '8', label: 'Avoids deadlocks by testing safe sequences', pair: 'D' }
  ];
  const [matchSelected, setMatchSelected] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);

  const handleTileClick = (tile) => {
    if (matchedPairs.includes(tile.pair)) return;
    if (matchSelected.some((t) => t.id === tile.id)) return;

    const nextSelected = [...matchSelected, tile];
    setMatchSelected(nextSelected);

    if (nextSelected.length === 2) {
      if (nextSelected[0].pair === nextSelected[1].pair) {
        setMatchedPairs((p) => [...p, nextSelected[0].pair]);
        setSessionScore((s) => s + 75);
      }
      setTimeout(() => setMatchSelected([]), 800);
    }
  };

  // Game 5: Flashcard Battle State
  const [battleIdx, setBattleIdx] = useState(0);
  const [battleCombo, setBattleCombo] = useState(1);
  const [battleFlipped, setBattleFlipped] = useState(false);
  const BATTLE_CARDS = [
    { front: 'What does ACID represent in relational transactions?', back: 'Atomicity, Consistency, Isolation, Durability' },
    { front: 'What is the search time of an AVL or Red-Black Tree?', back: 'O(log N) guaranteed' },
    { front: 'In TCP, how does the receiver prevent buffer overflow?', back: 'Sliding window flow control' },
    { front: 'What is thrashing in operating systems?', back: 'Excessive page swapping collapsing CPU execution' }
  ];

  // Game 6: Algorithm Maze State
  const [mazeStep, setMazeStep] = useState(0);
  const MAZE_ROOMS = [
    {
      room: 'Chamber of Traversal',
      q: 'Which algorithm finds the shortest path on an unweighted grid?',
      options: ['Depth-First Search', 'Breadth-First Search', 'QuickSort', 'Linear Search'],
      ans: 1
    },
    {
      room: 'Negative Edge Cavern',
      q: 'Dijkstra fails on graphs containing what property?',
      options: ['Cycles', 'Negative Edge Weights', 'Directed Edges', 'Sparse Vertices'],
      ans: 1
    },
    {
      room: 'Spanning Tree Vault',
      q: 'Kruskal’s algorithm greedily adds edges sorted by weight using which data structure?',
      options: ['Disjoint Set Union (Union-Find)', 'Stack', 'Adjacency Matrix', 'Binary Trie'],
      ans: 0
    }
  ];

  // Game 7: Typing Code State
  const [typingInput, setTypingInput] = useState('');
  const TYPING_CODE_SNIPPET = 'def binary_search(nums, target):\n    low, high = 0, len(nums) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1';

  // Game 8: Binary Battle State
  const [binIdx, setBinIdx] = useState(0);
  const [binInput, setBinInput] = useState('');
  const [binFeedback, setBinFeedback] = useState(null);
  const BINARY_CHALLENGES = [
    { prompt: 'Convert binary 0b1011 to Decimal', expected: '11' },
    { prompt: 'Convert decimal 16 to Binary (without prefix)', expected: '10000' },
    { prompt: 'Convert hexadecimal 0xFF to Decimal', expected: '255' },
    { prompt: 'Evaluate bitwise: 0b1100 & 0b1010 to binary', expected: '1000' }
  ];

  // Game 9: SQL Detective State
  const [sqlSolved, setSqlSolved] = useState(false);

  // Game 10: AI Quiz Boss State
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [bossRound, setBossRound] = useState(0);
  const [bossResult, setBossResult] = useState(null);
  const BOSS_ROUNDS = [
    {
      bossMove: 'The Dragon casts Circular Wait!',
      q: 'How do you break Circular Wait and deal 35 HP damage?',
      options: [
        'Enforce strict linear ordering on all resource allocations',
        'Allocate infinite RAM',
        'Put all threads to sleep',
        'Increase deadlock frequency'
      ],
      ans: 0
    },
    {
      bossMove: 'The Dragon breathes Mutual Exclusion fire!',
      q: 'How do you neutralize Mutual Exclusion?',
      options: [
        'Make resources shareable where feasible (e.g. read-only copies / spooling)',
        'Acquire locks exclusively forever',
        'Disable context switching',
        'Trigger a system crash'
      ],
      ans: 0
    },
    {
      bossMove: 'Final Boss Spell: Banker’s Unsafe Surge!',
      q: 'What prevents the system from entering an Unsafe State?',
      options: [
        'Run safe-sequence check: grant request only if a completion sequence exists',
        'Ignore process maximum claim matrix',
        'Terminate all processes indiscriminately',
        'Disable paging'
      ],
      ans: 0
    }
  ];

  const handleBossAttack = (optionIdx) => {
    if (optionIdx === BOSS_ROUNDS[bossRound].ans) {
      const nextBossHp = Math.max(0, bossHp - 35);
      setBossHp(nextBossHp);
      if (nextBossHp <= 0) {
        setBossResult('VICTORY');
        setSessionScore((s) => s + 150);
        return;
      }
    } else {
      const nextPlayerHp = Math.max(0, playerHp - 35);
      setPlayerHp(nextPlayerHp);
      if (nextPlayerHp <= 0) {
        setBossResult('DEFEAT');
        return;
      }
    }

    if (bossRound + 1 < BOSS_ROUNDS.length) {
      setBossRound((r) => r + 1);
    } else {
      setBossResult(bossHp <= 30 ? 'VICTORY' : 'DEFEAT');
    }
  };

  // Reset helper
  const handleBackToArcade = () => {
    setActiveGame(null);
    setRushFinished(false);
    setRushTimer(25);
    setRushIdx(0);
    setBugIdx(0);
    setBugFeedback(null);
    setOutIdx(0);
    setOutFeedback(null);
    setMatchedPairs([]);
    setMatchSelected([]);
    setBattleIdx(0);
    setMazeStep(0);
    setTypingInput('');
    setBinIdx(0);
    setBinFeedback(null);
    setSqlSolved(false);
    setBossHp(100);
    setPlayerHp(100);
    setBossRound(0);
    setBossResult(null);
  };

  return (
    <div
      style={{ backgroundColor: themeConfig.bgCanvas }}
      className="min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-200"
    >
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
        {/* ========================================================= */}
        {/* TOP ARCADE HEADER */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-indigo-500" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Learning Games Arcade 🎮
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Learn through play: speed coding, bug hunting, output prediction, and AI boss raids.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeGame && (
              <button
                onClick={handleBackToArcade}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Arcade Games</span>
              </button>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold shadow-sm">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Session Score: {sessionScore} XP</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ARCADE GAME GRID (When no game is active) */}
        {/* Matches user screenshots with 10 cards */}
        {/* ========================================================= */}
        {!activeGame && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ARCADE_GAMES.map((game) => {
              const IconComp = game.icon;
              return (
                <div
                  key={game.id}
                  style={{
                    backgroundColor: themeConfig.bgCard,
                    borderColor: themeConfig.borderCard
                  }}
                  className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center border border-slate-200 dark:border-slate-700/60 shadow-sm group-hover:scale-105 transition-transform">
                        <IconComp className={`w-5 h-5 ${game.iconColor}`} />
                      </div>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border font-mono tracking-wider ${game.tagColor}`}
                      >
                        {game.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {game.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {game.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={() => setActiveGame(game.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <span>Play Now</span>
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVE MINI-GAME WORKSPACES */}
        {/* ========================================================= */}

        {/* 1. CODE RUSH */}
        {activeGame === 'code_rush' && (
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="rounded-2xl border p-6 space-y-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Code Rush — Speed Trivia</h2>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs font-bold">
                <span className="flex items-center gap-1 text-rose-500">
                  <Timer className="w-4 h-4" /> {rushTimer}s
                </span>
                <span className="text-indigo-500">Score: {rushScore} XP</span>
              </div>
            </div>

            {!rushFinished ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-400">
                  Question {rushIdx + 1} of {RUSH_QUESTIONS.length}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {RUSH_QUESTIONS[rushIdx].q}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {RUSH_QUESTIONS[rushIdx].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRushAnswer(idx)}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-medium text-xs text-left transition-all cursor-pointer"
                    >
                      <span className="font-bold text-indigo-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <Award className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Code Rush Complete!</h3>
                <p className="text-xs text-slate-400">You scored {rushScore} XP in rapid speed trivia.</p>
                <button
                  onClick={handleBackToArcade}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer"
                >
                  Return to Arcade
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. BUG HUNTER */}
        {activeGame === 'bug_hunter' && (
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="rounded-2xl border p-6 space-y-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bug Hunter — Spot Syntax & Logic Errors
                </h2>
              </div>
              <span className="text-xs text-slate-400">Challenge {bugIdx + 1} of {BUG_CHALLENGES.length}</span>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Click on the line containing the bug:
              </p>
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs space-y-1.5 border border-slate-800 text-slate-200">
                {BUG_CHALLENGES[bugIdx].lines.map((line, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setBugSelectedLine(idx);
                      if (idx === BUG_CHALLENGES[bugIdx].bugLine) {
                        setBugFeedback({ correct: true, text: `Correct! Fix: ${BUG_CHALLENGES[bugIdx].fix}` });
                        setSessionScore((s) => s + 60);
                      } else {
                        setBugFeedback({ correct: false, text: 'Not quite. Check array boundaries and parameters!' });
                      }
                    }}
                    className={`px-3 py-1.5 rounded cursor-pointer transition-colors flex items-center justify-between ${
                      bugSelectedLine === idx
                        ? idx === BUG_CHALLENGES[bugIdx].bugLine
                          ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                          : 'bg-rose-950/80 border border-rose-500 text-rose-300'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <span>
                      <span className="text-slate-500 mr-4">{idx + 1}</span>
                      {line}
                    </span>
                    {bugSelectedLine === idx && (
                      <span>{idx === BUG_CHALLENGES[bugIdx].bugLine ? '✓ Bug' : '✗ Safe'}</span>
                    )}
                  </div>
                ))}
              </div>

              {bugFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    bugFeedback.correct
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {bugFeedback.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. OUTPUT PREDICTOR */}
        {activeGame === 'output_predictor' && (
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="rounded-2xl border p-6 space-y-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Output Predictor — Mental Code Execution
                </h2>
              </div>
              <span className="text-xs text-slate-400">Puzzle {outIdx + 1} of {OUTPUT_PUZZLES.length}</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 whitespace-pre">
                {OUTPUT_PUZZLES[outIdx].code}
              </div>

              <p className="text-xs font-bold text-slate-900 dark:text-white">
                What does this code output to stdout?
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {OUTPUT_PUZZLES[outIdx].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const isRight = opt === OUTPUT_PUZZLES[outIdx].correct;
                      setOutFeedback({
                        correct: isRight,
                        text: isRight
                          ? `Correct! ${OUTPUT_PUZZLES[outIdx].expl}`
                          : `Incorrect. Expected ${OUTPUT_PUZZLES[outIdx].correct}. ${OUTPUT_PUZZLES[outIdx].expl}`
                      });
                      if (isRight) setSessionScore((s) => s + 50);
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-mono text-xs font-bold hover:border-emerald-500 transition-all cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {outFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    outFeedback.correct
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {outFeedback.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. MEMORY MATCH */}
        {activeGame === 'memory_match' && (
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="rounded-2xl border p-6 space-y-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Memory Match — Concept Definition Tiles
                </h2>
              </div>
              <span className="text-xs text-blue-500 font-bold">
                Pairs Matched: {matchedPairs.length} / {MEMORY_TILES.length / 2}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MEMORY_TILES.map((tile) => {
                const isSelected = matchSelected.some((t) => t.id === tile.id);
                const isMatched = matchedPairs.includes(tile.pair);

                return (
                  <button
                    key={tile.id}
                    onClick={() => handleTileClick(tile)}
                    disabled={isMatched}
                    className={`h-24 p-3 rounded-xl border text-xs font-bold flex items-center justify-center text-center transition-all cursor-pointer ${
                      isMatched
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 opacity-60'
                        : isSelected
                        ? 'bg-blue-600 text-white border-blue-600 scale-95 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-500'
                    }`}
                  >
                    {tile.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. FLASHCARD BATTLE */}
        {activeGame === 'flashcard_battle' && (
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="rounded-2xl border p-6 space-y-6 shadow-sm text-center"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Flashcard Battle</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-500 font-mono font-bold border border-purple-500/30">
                Combo: {battleCombo}x Multiplier 🔥
              </span>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div
                onClick={() => setBattleFlipped(!battleFlipped)}
                className="h-44 p-6 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 border border-slate-700 text-white flex flex-col items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-[1.02]"
              >
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono mb-2">
                  {battleFlipped ? 'Answer (Click to flip)' : 'Prompt (Click to reveal)'}
                </span>
                <p className="text-sm font-bold">
                  {battleFlipped
                    ? BATTLE_CARDS[battleIdx].back
                    : BATTLE_CARDS[battleIdx].front}
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setBattleCombo(1);
                    setBattleFlipped(false);
                    setBattleIdx((i) => (i + 1) % BATTLE_CARDS.length);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                >
                  Missed (-Combo)
                </button>
                <button
                  onClick={() => {
                    setBattleCombo((c) => c + 1);
                    setSessionScore((s) => s + 25 * battleCombo);
                    setBattleFlipped(false);
                    setBattleIdx((i) => (i + 1) % BATTLE_CARDS.length);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Nailed It! (+{25 * battleCombo} XP)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. ALGORITHM MAZE */}
        {activeGame === 'algorithm_maze' && (
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="rounded-2xl border p-6 space-y-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Algorithm Maze — Dungeon Checkpoints
                </h2>
              </div>
              <span className="text-xs text-teal-500 font-bold font-mono">
                Room {mazeStep + 1} of {MAZE_ROOMS.length}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span>{MAZE_ROOMS[mazeStep].room}:</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {MAZE_ROOMS[mazeStep].q}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {MAZE_ROOMS[mazeStep].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (idx === MAZE_ROOMS[mazeStep].ans) {
                        setSessionScore((s) => s + 70);
                        if (mazeStep + 1 < MAZE_ROOMS.length) {
                          setMazeStep((s) => s + 1);
                        } else {
                          alert('🎉 Maze Conquered! You reached the Master Sanctum!');
                          handleBackToArcade();
                        }
                      } else {
                        alert('⚠️ Dead end! That path leads into a pit of infinite loops. Try another path!');
                      }
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-medium text-xs text-left hover:border-teal-500 transition-all cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. TYPING CODE */}
        {activeGame === 'typing_code' && (
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="rounded-2xl border p-6 space-y-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Typing Code — WPM & Syntax Test
                </h2>
              </div>
              <span className="text-xs text-cyan-500 font-bold font-mono">
                Progress: {Math.min(100, Math.round((typingInput.length / TYPING_CODE_SNIPPET.length) * 100))}%
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-400 border border-slate-800 whitespace-pre select-none">
                {TYPING_CODE_SNIPPET}
              </div>

              <textarea
                value={typingInput}
                onChange={(e) => setTypingInput(e.target.value)}
                placeholder="Type the exact code above here..."
                rows={6}
                className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* 8. BINARY BATTLE */}
        {activeGame === 'binary_battle' && (
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="rounded-2xl border p-6 space-y-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Binary Battle — Number System Conversion
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Round {binIdx + 1} of {BINARY_CHALLENGES.length}
              </span>
            </div>

            <div className="space-y-4 max-w-md mx-auto text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {BINARY_CHALLENGES[binIdx].prompt}
              </h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={binInput}
                  onChange={(e) => setBinInput(e.target.value)}
                  placeholder="Enter answer..."
                  className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => {
                    const isRight = binInput.trim().toUpperCase() === BINARY_CHALLENGES[binIdx].expected;
                    if (isRight) {
                      setBinFeedback({ correct: true, text: '✓ Correct conversion!' });
                      setSessionScore((s) => s + 40);
                      setTimeout(() => {
                        setBinInput('');
                        setBinFeedback(null);
                        setBinIdx((i) => (i + 1) % BINARY_CHALLENGES.length);
                      }, 1000);
                    } else {
                      setBinFeedback({ correct: false, text: `✗ Expected: ${BINARY_CHALLENGES[binIdx].expected}` });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Verify
                </button>
              </div>

              {binFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold ${
                    binFeedback.correct ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {binFeedback.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. SQL DETECTIVE */}
        {activeGame === 'sql_detective' && (
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="rounded-2xl border p-6 space-y-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  SQL Detective — The Murder Mystery
                </h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-orange-500/15 text-orange-500 font-bold border border-orange-500/30">
                Case #2026-B
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-800 dark:text-orange-300">
                <strong>Crime Brief:</strong> A classified memory key was stolen from the Server Room at 23:44. Inspect the swipe card logs and suspect database to find the intruder.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                  <div className="font-bold text-indigo-400 mb-1">TABLE: suspects</div>
                  <div>id | name | role</div>
                  <div>1 | Alice Dev | Backend</div>
                  <div>2 | Bob Root | SysAdmin</div>
                  <div>3 | Charlie | Intern</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                  <div className="font-bold text-indigo-400 mb-1">TABLE: swipe_logs</div>
                  <div>door | user_id | time</div>
                  <div>Cafeteria | 1 | 23:40</div>
                  <div>Server Room | 2 | 23:44</div>
                  <div>Lobby | 3 | 23:50</div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                  Who is the culprit identified by the SQL query?
                </p>
                <div className="flex gap-2">
                  {['Alice Dev', 'Bob Root', 'Charlie'].map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        if (name === 'Bob Root') {
                          setSqlSolved(true);
                          setSessionScore((s) => s + 100);
                        } else {
                          alert('False accusation! Check the Server Room timestamp.');
                        }
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-orange-500 text-xs font-bold cursor-pointer"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {sqlSolved && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
                  🎉 Case Solved! Bob Root was logged entering the Server Room at 23:44. (+100 XP)
                </div>
              )}
            </div>
          </div>
        )}

        {/* 10. AI QUIZ BOSS */}
        {activeGame === 'quiz_boss' && (
          <div
            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderCard }}
            className="rounded-2xl border p-6 space-y-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  AI Quiz Boss — RPG Boss Raid
                </h2>
              </div>
              <span className="text-xs text-red-500 font-bold font-mono">
                Round {bossRound + 1} of {BOSS_ROUNDS.length}
              </span>
            </div>

            {/* HP Bars */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>🧙 Player</span>
                  <span className="text-emerald-400">{playerHp} / 100 HP</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${playerHp}%` }}
                    className="h-full bg-emerald-500 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>🐉 Deadlock Dragon</span>
                  <span className="text-red-400">{bossHp} / 100 HP</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${bossHp}%` }}
                    className="h-full bg-red-500 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {!bossResult ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-500">
                  {BOSS_ROUNDS[bossRound].bossMove}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {BOSS_ROUNDS[bossRound].q}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BOSS_ROUNDS[bossRound].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleBossAttack(idx)}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-red-500 text-xs font-medium text-slate-800 dark:text-slate-100 text-left transition-all cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {bossResult === 'VICTORY' ? '🏆 BOSS DEFEATED!' : '💀 DEFEAT'}
                </h3>
                <p className="text-xs text-slate-400">
                  {bossResult === 'VICTORY'
                    ? 'You broke all 4 Coffman conditions and saved the kernel state!'
                    : 'The deadlock dragon engulfed the threads in an infinite stall.'}
                </p>
                <button
                  onClick={handleBackToArcade}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                >
                  Return to Arcade
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
