import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Headphones,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Flag,
  HelpCircle,
  BookOpen,
  Globe,
  Cpu,
  Activity,
  FileText,
  Video,
  Mic,
  ArrowRight,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import { SmartExamEngine } from '../../services/smartExamEngine';

export const SmartExamMentorStudio = ({
  scopedDocument = '',
  customTopic = '',
  onAskTutorQuestion,
  onClose
}) => {
  const [bundle, setBundle] = useState(null);
  const [bayesian, setBayesian] = useState(() => SmartExamEngine.getBayesianState());
  const [activeTab, setActiveTab] = useState('mcq'); // 'mcq' | 'fib' | 'tf' | 'faq' | 'eli12' | 'podcast' | 'similar' | 'flagged'

  // Quiz interaction states
  const [mcqSelected, setMcqSelected] = useState({});
  const [mcqSubmitted, setMcqSubmitted] = useState({});
  const [fibInputs, setFibInputs] = useState({});
  const [fibSubmitted, setFibSubmitted] = useState({});
  const [fibHints, setFibHints] = useState({});
  const [tfSubmitted, setTfSubmitted] = useState({});
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);

  useEffect(() => {
    const generated = SmartExamEngine.generateSmartMentorBundle({
      documentName: scopedDocument,
      customTopic
    });
    setBundle(generated);
    setMcqSelected({});
    setMcqSubmitted({});
    setFibInputs({});
    setFibSubmitted({});
    setTfSubmitted({});
  }, [scopedDocument, customTopic]);

  if (!bundle) return null;

  const handleMcqSubmit = (q) => {
    const picked = mcqSelected[q.id];
    if (!picked) return;
    const isCorrect = picked === q.correctOption;
    setMcqSubmitted((prev) => ({ ...prev, [q.id]: { picked, isCorrect } }));
    const nextBayes = SmartExamEngine.updateBayesianPosterior({
      questionId: q.id,
      isCorrect,
      difficultyWeight: q.difficulty === 'Hard' ? 1.25 : 1.0
    });
    setBayesian(nextBayes);
  };

  const handleFibSubmit = (item) => {
    const raw = (fibInputs[item.id] || '').trim().toLowerCase();
    if (!raw) return;
    const isCorrect = item.acceptedAnswers.some(
      (ans) => raw === ans.toLowerCase() || raw.includes(ans.toLowerCase())
    );
    setFibSubmitted((prev) => ({ ...prev, [item.id]: { raw, isCorrect } }));
    const nextBayes = SmartExamEngine.updateBayesianPosterior({
      questionId: item.id,
      isCorrect,
      difficultyWeight: 1.1
    });
    setBayesian(nextBayes);
  };

  const handleTfSubmit = (item, chosenBool) => {
    const isCorrect = chosenBool === item.correctAnswer;
    setTfSubmitted((prev) => ({ ...prev, [item.id]: { chosenBool, isCorrect } }));
    const nextBayes = SmartExamEngine.updateBayesianPosterior({
      questionId: item.id,
      isCorrect,
      difficultyWeight: 0.95
    });
    setBayesian(nextBayes);
  };

  const handleToggleFlag = (questionId) => {
    const nextBayes = SmartExamEngine.toggleFlagQuestion(questionId);
    setBayesian(nextBayes);
  };

  const togglePodcastAudio = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingPodcast) {
      window.speechSynthesis.cancel();
      setIsPlayingPodcast(false);
      return;
    }
    const fullScript = (bundle.podcast?.dialogue || [])
      .map((line) => `${line.speaker} says: ${line.text}`)
      .join(' ... ');
    const utterance = new SpeechSynthesisUtterance(fullScript);
    utterance.rate = 1.02;
    utterance.onend = () => setIsPlayingPodcast(false);
    utterance.onerror = () => setIsPlayingPodcast(false);
    setIsPlayingPodcast(true);
    window.speechSynthesis.speak(utterance);
  };

  const flaggedCount = bayesian.flaggedQuestionIds?.length || 0;

  return (
    <div className="space-y-4 pb-6">
      {/* Top Banner: Comprehensive Content → Gemini Multimodal AI + TTS → Smart Exam Mentor & Simplified Adaptive Learning */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini Multimodal AI + TTS Subtitling
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Bayesian Active Learning Loop
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white mt-1.5">
              Smart Exam Mentor & Simplified Adaptive Learning: {bundle.topic}
            </h2>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Back to AI Chat
            </button>
          )}
        </div>

        {/* Comprehensive Content Modalities Strip (Diagram 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {(bundle.modalities || []).map((mod, i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                {mod.type.includes('Video') ? (
                  <Video className="w-4 h-4 text-sky-400 shrink-0" />
                ) : mod.type.includes('Audio') ? (
                  <Mic className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                )}
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">{mod.type}</div>
                  <div className="text-[11px] text-slate-200 font-mono truncate">{mod.label}</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold shrink-0 ml-2">
                {mod.status}
              </span>
            </div>
          ))}
        </div>

        {/* Diagram 5: Live Bayesian Updating & Active Learning Loop Telemetry */}
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Bayesian Updating & Active Learning Loop (User Feedback D → P(θ|D) → Question DB → A(q) → Flagged)
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Evidence Events (D): {bayesian.evidenceCount}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-slate-900 border border-sky-500/25">
              <span className="text-[10px] text-sky-400 block">1. User Feedback (D)</span>
              <span className="text-white font-bold">
                Prior θ = {Math.round(bayesian.priorTheta * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 block">2. Bayesian P(θ|D)</span>
              <span className="text-emerald-300 font-bold">
                Posterior θ' = {Math.round(bayesian.posteriorTheta * 100)}%
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-purple-500/25">
              <span className="text-[10px] text-purple-400 block">3. Question DB (q ∈ Q)</span>
              <span className="text-white font-bold">
                {(bundle.mcqs?.length || 0) +
                  (bundle.fillInTheBlanks?.length || 0) +
                  (bundle.trueOrFalse?.length || 0)}{' '}
                Active Items
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-amber-500/30">
              <span className="text-[10px] text-amber-400 block">4. Active Learning A(q)</span>
              <span className="text-amber-300 font-bold">
                A(q)={bayesian.activeAcquisitionScore} (V_q={bayesian.uncertaintyVarianceVq})
              </span>
            </div>
            <button
              onClick={() => setActiveTab('flagged')}
              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-colors"
            >
              <span className="text-[10px] text-rose-300 block flex items-center justify-between">
                <span>5. Flagged Questions</span>
                <Flag className="w-3 h-3 text-rose-400" />
              </span>
              <span className="text-rose-200 font-bold">{flaggedCount} Flagged for Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar: Smart Exam Mentor (MCQ, Fill in the Blanks, True/False, FAQ) + Simplified Adaptive Learning (ELI12, Podcast, Similar) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
        {[
          { id: 'mcq', label: '1. MCQ Quiz', badge: bundle.mcqs?.length || 0, group: 'Exam Mentor' },
          {
            id: 'fib',
            label: '2. Fill in Blanks',
            badge: bundle.fillInTheBlanks?.length || 0,
            group: 'Exam Mentor'
          },
          {
            id: 'tf',
            label: '3. True or False',
            badge: bundle.trueOrFalse?.length || 0,
            group: 'Exam Mentor'
          },
          { id: 'faq', label: '4. Exam FAQs', badge: bundle.faqs?.length || 0, group: 'Exam Mentor' },
          { id: 'eli12', label: '🧒 ELI12 Mode', badge: 'Simple', group: 'Adaptive' },
          { id: 'podcast', label: '🎙️ AI Podcast', badge: 'Audio', group: 'Adaptive' },
          {
            id: 'similar',
            label: '🌐 Similar Content',
            badge: bundle.similarContent?.length || 0,
            group: 'Adaptive'
          },
          {
            id: 'flagged',
            label: '🚩 Flagged Queue',
            badge: flaggedCount,
            group: 'Bayesian'
          }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-2 rounded-xl text-left border transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-[9px] uppercase tracking-wider opacity-75">{tab.group}</div>
              <div className="text-xs font-bold truncate mt-0.5">{tab.label}</div>
              <div className="text-[10px] font-mono opacity-80 mt-0.5">{tab.badge}</div>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SMART EXAM MENTOR — MCQ */}
      {activeTab === 'mcq' && (
        <div className="space-y-3">
          {(bundle.mcqs || []).map((q, idx) => {
            const sub = mcqSubmitted[q.id];
            const isFlagged = bayesian.flaggedQuestionIds?.includes(q.id);
            return (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-300 font-mono">
                    MCQ #{idx + 1} • {q.concept} ({q.difficulty})
                  </span>
                  <button
                    onClick={() => handleToggleFlag(q.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                      isFlagged
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flag className="w-3 h-3" />
                    <span>{isFlagged ? 'Flagged in Active Learning' : 'Flag Question'}</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-white">{q.question}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt) => {
                    const isPicked = mcqSelected[q.id] === opt.id;
                    const showCorrect = sub && opt.id === q.correctOption;
                    const showWrong = sub && isPicked && !sub.isCorrect;

                    return (
                      <button
                        key={opt.id}
                        disabled={Boolean(sub)}
                        onClick={() => setMcqSelected((prev) => ({ ...prev, [q.id]: opt.id }))}
                        className={`p-3 rounded-xl border text-left text-xs flex items-start gap-2.5 transition-all ${
                          showCorrect
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 font-semibold'
                            : showWrong
                            ? 'bg-rose-500/15 border-rose-500 text-rose-200'
                            : isPicked
                            ? 'bg-indigo-600/25 border-indigo-500 text-white'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="px-2 py-0.5 rounded bg-slate-900 font-mono font-bold text-[11px]">
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {!sub ? (
                  <button
                    onClick={() => handleMcqSubmit(q)}
                    disabled={!mcqSelected[q.id]}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold"
                  >
                    Submit Answer & Update Bayesian θ'
                  </button>
                ) : (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      sub.isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="font-bold mb-1">
                      {sub.isCorrect
                        ? '✅ Correct! Bayesian Posterior P(θ|D) increased.'
                        : `❌ Incorrect (Correct: ${q.correctOption}). Automatically added to Flagged Active Learning Queue.`}
                    </div>
                    <p className="text-slate-300">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: SMART EXAM MENTOR — FILL IN THE BLANKS */}
      {activeTab === 'fib' && (
        <div className="space-y-3">
          {(bundle.fillInTheBlanks || []).map((item, idx) => {
            const sub = fibSubmitted[item.id];
            const showHint = fibHints[item.id];
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    Fill in the Blank #{idx + 1} • {item.concept}
                  </span>
                  <button
                    onClick={() => setFibHints((p) => ({ ...p, [item.id]: !p[item.id] }))}
                    className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-white font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {item.sentence}
                </p>

                {showHint && (
                  <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-xl">
                    💡 Hint: {item.hint}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    disabled={Boolean(sub)}
                    value={fibInputs[item.id] || ''}
                    onChange={(e) => setFibInputs((p) => ({ ...p, [item.id]: e.target.value }))}
                    placeholder="Type the missing term..."
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 min-w-[240px]"
                  />
                  {!sub && (
                    <button
                      onClick={() => handleFibSubmit(item)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      Verify Blank
                    </button>
                  )}
                </div>

                {sub && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      sub.isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="font-bold">
                      {sub.isCorrect
                        ? '✅ Exact Match!'
                        : `❌ Expected: "${item.acceptedAnswers[0]}"`}
                    </div>
                    <p className="text-slate-300 mt-1">{item.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: SMART EXAM MENTOR — TRUE OR FALSE */}
      {activeTab === 'tf' && (
        <div className="space-y-3">
          {(bundle.trueOrFalse || []).map((item, idx) => {
            const sub = tfSubmitted[item.id];
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <span className="text-xs font-bold text-emerald-300 font-mono">
                  True or False #{idx + 1} • {item.concept}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white">{item.statement}</p>

                <div className="flex items-center gap-3">
                  <button
                    disabled={Boolean(sub)}
                    onClick={() => handleTfSubmit(item, true)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      sub && item.correctAnswer === true
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500'
                    }`}
                  >
                    TRUE
                  </button>
                  <button
                    disabled={Boolean(sub)}
                    onClick={() => handleTfSubmit(item, false)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      sub && item.correctAnswer === false
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500'
                    }`}
                  >
                    FALSE
                  </button>
                </div>

                {sub && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      sub.isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="font-bold mb-1">
                      {sub.isCorrect ? '✅ Correct!' : '❌ Misconception Detected!'}
                    </div>
                    <p className="text-slate-300">{item.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: SMART EXAM MENTOR — HIGH-YIELD FAQs */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {(bundle.faqs || []).map((faq, idx) => (
            <div
              key={faq.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-300">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>
                  FAQ #{idx + 1}: {faq.question}
                </span>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed pl-6">
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: SIMPLIFIED ADAPTIVE LEARNING — ELI12 EXPLANATION */}
      {activeTab === 'eli12' && bundle.eli12Explanation && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-4">
          <h3 className="text-base font-bold text-amber-300">{bundle.eli12Explanation.title}</h3>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-100 font-medium">
            {bundle.eli12Explanation.analogy}
          </div>
          <div className="space-y-2.5">
            {(bundle.eli12Explanation.storySteps || []).map((step, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed"
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SIMPLIFIED ADAPTIVE LEARNING — AI STUDY PODCAST */}
      {activeTab === 'podcast' && bundle.podcast && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">
                Gemini Multimodal TTS Audio Podcast • {bundle.podcast.duration}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{bundle.podcast.title}</h3>
            </div>
            <button
              onClick={togglePodcastAudio}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              {isPlayingPodcast ? (
                <>
                  <VolumeX className="w-4 h-4 animate-pulse" />
                  <span>Stop Podcast Audio</span>
                </>
              ) : (
                <>
                  <Headphones className="w-4 h-4" />
                  <span>▶ Play Study Podcast (TTS)</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2.5">
            {(bundle.podcast.dialogue || []).map((line, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  line.speaker === 'Alex'
                    ? 'bg-slate-950 border-slate-800 text-slate-200'
                    : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-100'
                }`}
              >
                <span className="font-bold text-indigo-300 uppercase text-[11px] block mb-1">
                  🎙️ {line.speaker}
                </span>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SIMPLIFIED ADAPTIVE LEARNING — SIMILAR CONTENT RECOMMENDATIONS */}
      {activeTab === 'similar' && (
        <div className="space-y-3">
          {(bundle.similarContent || []).map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-mono font-bold">
                    {item.matchScore}
                  </span>
                  <span className="text-xs font-bold text-white">{item.title}</span>
                </div>
                <div className="text-[11px] text-indigo-300 font-mono">{item.type}</div>
                <p className="text-xs text-slate-400">{item.reason}</p>
              </div>
              {onAskTutorQuestion && (
                <button
                  onClick={() => onAskTutorQuestion(`Explain ${item.title} with examples`)}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <span>Explore in AI Tutor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 8: BAYESIAN ACTIVE LEARNING — FLAGGED QUESTIONS QUEUE */}
      {activeTab === 'flagged' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Active Learning Flagged Questions Queue ({flaggedCount})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Acquisition Weight α_q = {bayesian.acquisitionAlpha}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Questions answered incorrectly or manually flagged are routed back into the Active Learning selector with boosted acquisition priority $A(q) = \alpha_q \cdot V_q$.
          </p>
          {flaggedCount === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 text-xs text-emerald-400 font-semibold">
              🎉 Zero flagged questions remaining! Your Bayesian mastery posterior is {Math.round(bayesian.posteriorTheta * 100)}%.
            </div>
          ) : (
            <div className="space-y-2">
              {(bundle.mcqs || [])
                .filter((q) => bayesian.flaggedQuestionIds.includes(q.id))
                .map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-rose-300 block">{q.concept}</span>
                      <span className="text-slate-300">{q.question}</span>
                    </div>
                    <button
                      onClick={() => handleToggleFlag(q.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] shrink-0"
                    >
                      Resolve Flag
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
