import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Sparkles,
  BookOpen,
  Zap,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  FileText,
  Trophy,
  Brain,
  Target,
  Clock
} from 'lucide-react';
import { AdaptivePhaseEngine } from '../../services/adaptivePhaseEngine';
import { ContentSanitizer } from '../../services/contentSanitizer';
import { EducationalContentRenderer } from '../common/EducationalContentRenderer';

export const AdaptivePhaseStudio = ({
  documentName = '',
  customTopic = '',
  onAskTutorAboutConcept,
  onCloseStudio
}) => {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('phase_1'); // 'phase_1' | 'phase_2' | 'phase_3' | 'grand_quiz'
  const [viewMode, setViewMode] = useState('study'); // 'study' | 'quiz' | 'phase_result' | 'grand_intro' | 'grand_quiz' | 'grand_report'
  const [responseDepth, setResponseDepth] = useState('explanation'); // 'brief' | 'explanation'
  const [showQuickCheckAnswer, setShowQuickCheckAnswer] = useState(false);

  // Active MCQ Quiz state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});

  useEffect(() => {
    const loaded = AdaptivePhaseEngine.createOrLoadSession({ documentName, customTopic });
    setSession(loaded);
    if (loaded) {
      const targetP = loaded.currentPhaseNumber || 1;
      setActiveTab(`phase_${targetP}`);
      setViewMode('study');
      setShowQuickCheckAnswer(false);
    }
  }, [documentName, customTopic]);

  if (!session) return null;

  const currentPhaseNum = activeTab.startsWith('phase_')
    ? Number(activeTab.replace('phase_', ''))
    : 1;
  const activePhase =
    session.phases.find((p) => p.number === currentPhaseNum) || session.phases[0];

  const startPhaseQuiz = (phaseNum) => {
    setActiveTab(`phase_${phaseNum}`);
    setViewMode('quiz');
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setQuizAnswers({});
  };

  const startGrandQuiz = () => {
    setActiveTab('grand_quiz');
    setViewMode('grand_quiz');
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setQuizAnswers({});
  };

  const activeQuestions =
    viewMode === 'grand_quiz'
      ? session.grandQuiz?.questions || []
      : activePhase?.quiz || [];
  const currentQuestion = activeQuestions[currentQIndex];

  const handleSubmitSingleQuestion = () => {
    if (!selectedOption || !currentQuestion) return;
    setIsSubmitted(true);
    setQuizAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedOption
    }));
  };

  const handleNextQuestion = () => {
    const updatedAnswers = {
      ...quizAnswers,
      [currentQuestion.id]: selectedOption
    };

    if (currentQIndex < activeQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      if (viewMode === 'grand_quiz') {
        const res = AdaptivePhaseEngine.evaluateGrandQuiz(session.id, updatedAnswers);
        if (res && res.session) {
          setSession({ ...res.session });
          setViewMode('grand_report');
        }
      } else {
        const res = AdaptivePhaseEngine.evaluatePhaseQuiz(
          session.id,
          activePhase.number,
          updatedAnswers
        );
        if (res && res.session) {
          setSession({ ...res.session });
          setViewMode('phase_result');
        }
      }
    }
  };

  const handleResetCurriculum = () => {
    const fresh = AdaptivePhaseEngine.regenerateSession({
      documentName: session.sourceDocument,
      customTopic
    });
    setSession({ ...fresh });
    setActiveTab('phase_1');
    setViewMode('study');
    setShowQuickCheckAnswer(false);
  };

  const allPhasesDone = session.phases.every((p) => p.completionStatus === 'COMPLETED');
  const cleanSourceTitle = ContentSanitizer.cleanDocumentTitle(session.sourceDocument);

  const flowSteps = [
    { id: 'ingested', label: 'Material Ingested', done: true },
    { id: 'understood', label: 'AI Understands', done: true },
    { id: 'plan', label: 'Learning Plan', done: true },
    {
      id: 'p1',
      label: 'Phase 1',
      done: session.phases[0]?.completionStatus === 'COMPLETED',
      active: activeTab === 'phase_1'
    },
    {
      id: 'p2',
      label: 'Phase 2',
      done: session.phases[1]?.completionStatus === 'COMPLETED',
      active: activeTab === 'phase_2'
    },
    {
      id: 'p3',
      label: 'Phase 3',
      done: session.phases[2]?.completionStatus === 'COMPLETED',
      active: activeTab === 'phase_3'
    },
    {
      id: 'gq',
      label: 'Grand Quiz',
      done: Boolean(session.grandQuiz?.completed),
      active: activeTab === 'grand_quiz'
    }
  ];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in">
      {/* Top Header & AI Curriculum Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> 3-Phase Adaptive Learning
            </span>
            <span className="text-xs text-slate-400 italic">
              Source: {cleanSourceTitle}
            </span>
          </div>
          <h2 className="text-base font-bold text-white">{session.title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{session.aiPlannerRationale}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetCurriculum}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Regenerate Clean 3-Phase Curriculum"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          {onCloseStudio && (
            <button
              onClick={onCloseStudio}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Back to Chat
            </button>
          )}
        </div>
      </div>

      {/* Visual Learning Flow Pipeline (Section 21) */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {flowSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <span
                  className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                    step.active
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : step.done
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {step.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  <span>{step.label}</span>
                </span>
                {index < flowSteps.length - 1 && (
                  <span className="text-slate-600 font-bold">→</span>
                )}
              </React.Fragment>
            ))}
          </div>

          <span className="text-xs font-semibold text-indigo-300">
            {session.phases.filter((p) => p.completionStatus === 'COMPLETED').length} of 3 Phases Completed
          </span>
        </div>

        {/* Phase & Grand Quiz Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {session.phases.map((p) => {
            const isCompleted = p.completionStatus === 'COMPLETED';
            const isCurrent = activeTab === `phase_${p.number}`;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setActiveTab(`phase_${p.number}`);
                  setViewMode('study');
                  setShowQuickCheckAnswer(false);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/15'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs">
                        {p.number}
                      </span>
                    )}
                    <span>Phase {p.number}</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-950/60 text-slate-400">
                    {p.difficulty}
                  </span>
                </div>
                <div className="text-sm font-semibold mt-1.5 truncate">{p.patternLabel}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>{p.quiz?.length || 5} MCQs</span>
                  {p.performance && (
                    <span className="text-emerald-400 font-semibold">
                      {p.performance.score}/{p.performance.total} ({p.performance.accuracy}%)
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Grand Quiz Step Card */}
          <button
            onClick={() => {
              setActiveTab('grand_quiz');
              if (session.grandQuiz?.completed) {
                setViewMode('grand_report');
              } else {
                setViewMode('grand_intro');
              }
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeTab === 'grand_quiz'
                ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                : allPhasesDone || session.grandQuiz?.unlocked
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/20'
                : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                {allPhasesDone || session.grandQuiz?.unlocked ? (
                  <Unlock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-500" />
                )}
                <span>Grand Quiz</span>
              </span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-semibold mt-1.5 truncate">All 3 Phases</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>{session.grandQuiz?.totalQuestions || 15} MCQs</span>
              {session.grandQuiz?.result && (
                <span className="text-amber-300 font-semibold">
                  {session.grandQuiz.result.percentage}%
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* VIEW 1: PHASE STUDY MODE (With Brief vs Deep Explanation Toggle) */}
      {viewMode === 'study' && activePhase && (
        <div className="space-y-5">
          {/* Phase Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  Phase {activePhase.number}: {activePhase.patternLabel}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {activePhase.estimatedLearningTime}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{activePhase.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-indigo-300">Learning Goal:</strong> {activePhase.objective}
              </p>
            </div>

            {/* Brief vs Deep Explanation Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
              <button
                onClick={() => setResponseDepth('brief')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  responseDepth === 'brief'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Brief</span>
              </button>
              <button
                onClick={() => setResponseDepth('explanation')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  responseDepth === 'explanation'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Deep Explanation</span>
              </button>
            </div>
          </div>

          {/* Phase Concepts & Prerequisites Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Key Concepts:</span>
            {activePhase.concepts.map((c, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 font-medium"
              >
                {ContentSanitizer.cleanText(c)}
              </span>
            ))}
            <span className="text-slate-600 mx-1">•</span>
            <span className="text-slate-400 font-semibold">Builds On:</span>
            {activePhase.prerequisites.map((pre, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300"
              >
                {ContentSanitizer.cleanText(pre)}
              </span>
            ))}
          </div>

          {/* Clean Teacher-Grade Lesson Body (Single Base Font Size, No Raw Markdown/PDF Artifacts) */}
          <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800">
            <EducationalContentRenderer
              content={
                responseDepth === 'brief'
                  ? activePhase.briefContent
                  : activePhase.explanationContent
              }
            />
          </div>

          {/* Interactive Quick Check Block (Section 18) */}
          {activePhase.quickCheck && (
            <div className="p-4 rounded-xl bg-indigo-950/25 border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> Quick Concept Check
                </span>
                <button
                  onClick={() => setShowQuickCheckAnswer((prev) => !prev)}
                  className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 underline"
                >
                  {showQuickCheckAnswer ? 'Hide Answer' : 'Reveal Answer'}
                </button>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {activePhase.quickCheck.question}
              </p>
              {showQuickCheckAnswer && (
                <div className="p-3 rounded-lg bg-slate-900/90 border border-indigo-500/20 text-sm text-emerald-300 leading-relaxed">
                  <strong className="text-emerald-400">Answer: </strong>
                  {activePhase.quickCheck.answer}
                </div>
              )}
            </div>
          )}

          {/* Source References Footer + Start Phase MCQ Quiz CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-400 space-y-1">
              {activePhase.sourceReferences.map((ref, idx) => (
                <div key={idx} className="italic text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{ContentSanitizer.formatSourceReference(ref)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              {activePhase.performance && (
                <button
                  onClick={() => setViewMode('phase_result')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  View Last Score ({activePhase.performance.accuracy}%)
                </button>
              )}
              <button
                onClick={() => startPhaseQuiz(activePhase.number)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg flex items-center gap-2 transition-all"
              >
                <span>Start Phase {activePhase.number} Quiz ({activePhase.quiz.length} MCQs)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE MCQ QUIZ CARD (Phase Quiz OR Grand Quiz) */}
      {(viewMode === 'quiz' || viewMode === 'grand_quiz') && currentQuestion && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs">
                {viewMode === 'grand_quiz'
                  ? `Grand Quiz — Question ${currentQIndex + 1} of ${activeQuestions.length}`
                  : `Phase ${activePhase.number} Quiz — Question ${currentQIndex + 1} of ${activeQuestions.length}`}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs">
                Concept: {ContentSanitizer.cleanText(currentQuestion.concept)}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 text-xs">
                {currentQuestion.difficulty}
              </span>
            </div>

            <button
              onClick={() => setViewMode('study')}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Return to Lesson
            </button>
          </div>

          {/* Question Prompt */}
          <div className="text-sm font-bold text-white leading-relaxed">
            {ContentSanitizer.cleanText(currentQuestion.question)}
          </div>

          {/* 4 MCQ Options (A, B, C, D) */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isCorrectOption = opt.id === currentQuestion.correctAnswer;

              let optionStyle =
                'bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700';
              if (!isSubmitted && isSelected) {
                optionStyle = 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm';
              } else if (isSubmitted) {
                if (isCorrectOption) {
                  optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
                } else {
                  optionStyle = 'bg-slate-950/60 border-slate-800/60 text-slate-500';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={isSubmitted}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full p-3.5 rounded-xl border text-left text-sm flex items-center justify-between transition-all ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {opt.id}
                    </span>
                    <span className="leading-relaxed">
                      {ContentSanitizer.cleanText(opt.text)}
                    </span>
                  </div>
                  {isSubmitted && isCorrectOption && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {isSubmitted && isSelected && !isCorrectOption && (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Immediate Feedback Box */}
          {isSubmitted && (
            <div
              className={`p-4 rounded-xl border text-sm space-y-2 ${
                selectedOption === currentQuestion.correctAnswer
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="font-bold flex flex-wrap items-center justify-between gap-2">
                <span>
                  {selectedOption === currentQuestion.correctAnswer
                    ? 'Correct Answer'
                    : `Incorrect — Correct Option: ${currentQuestion.correctAnswer}`}
                </span>
                <span className="text-xs italic opacity-80">
                  {ContentSanitizer.formatSourceReference(currentQuestion.sourceReference)}
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                <strong>Why:</strong> {ContentSanitizer.cleanText(currentQuestion.explanation)}
              </p>
              {selectedOption !== currentQuestion.correctAnswer &&
                currentQuestion.remediationNote && (
                  <p className="text-amber-300 leading-relaxed pt-1 border-t border-rose-500/20">
                    <strong>You may want to revisit this concept:</strong>{' '}
                    {ContentSanitizer.cleanText(currentQuestion.remediationNote)}
                  </p>
                )}
            </div>
          )}

          {/* Submit / Next Button */}
          <div className="flex justify-end pt-2">
            {!isSubmitted ? (
              <button
                onClick={handleSubmitSingleQuestion}
                disabled={!selectedOption}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-bold shadow-md transition-all"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md flex items-center gap-2 transition-all"
              >
                <span>
                  {currentQIndex < activeQuestions.length - 1
                    ? 'Next Question'
                    : viewMode === 'grand_quiz'
                    ? 'Generate Final Learning Report'
                    : `Complete Phase ${activePhase.number} Evaluation`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: PHASE EVALUATION SUMMARY + TARGETED REMEDIATION (Section 17) */}
      {viewMode === 'phase_result' && activePhase?.performance && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase text-indigo-400 font-bold">
                Phase {activePhase.number} Evaluation Complete
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{activePhase.title}</h3>
            </div>
            <div className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-right">
              <span className="text-xs text-slate-400 block">Phase Score</span>
              <span className="text-base font-bold text-indigo-300">
                {activePhase.performance.score} / {activePhase.performance.total} ({activePhase.performance.accuracy}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Concepts Mastered
              </span>
              {activePhase.performance.strongConcepts.length > 0 ? (
                <ul className="space-y-1.5 text-sm text-slate-200">
                  {activePhase.performance.strongConcepts.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> {ContentSanitizer.cleanText(c)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">
                  Review the phase lesson to strengthen concept mastery before advancing.
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> You May Want to Revisit This Concept
              </span>
              {activePhase.performance.weakConcepts.length > 0 ? (
                <ul className="space-y-2 text-sm text-slate-200">
                  {activePhase.performance.weakConcepts.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span>• {ContentSanitizer.cleanText(c)}</span>
                      {onAskTutorAboutConcept && (
                        <button
                          onClick={() => onAskTutorAboutConcept(c)}
                          className="text-xs text-indigo-300 hover:underline font-semibold shrink-0"
                        >
                          Ask Tutor →
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-300">
                  All concepts in Phase {activePhase.number} were answered accurately.
                </p>
              )}
            </div>
          </div>

          {/* Targeted Concept Remediation Notes (Section 17) */}
          {activePhase.performance.remediationItems &&
            activePhase.performance.remediationItems.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-3">
                <div className="text-sm font-bold text-amber-300">
                  Targeted Concept Review Before Moving Forward
                </div>
                <div className="space-y-2.5">
                  {activePhase.performance.remediationItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-sm space-y-1"
                    >
                      <div className="font-semibold text-white">
                        {ContentSanitizer.cleanText(item.concept)}
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {ContentSanitizer.cleanText(item.note)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => startPhaseQuiz(activePhase.number)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Phase {activePhase.number} Quiz</span>
              </button>
              <button
                onClick={() => {
                  setResponseDepth('explanation');
                  setViewMode('study');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Review Lesson in Deep Mode
              </button>
            </div>

            {activePhase.number < 3 ? (
              <button
                onClick={() => {
                  setActiveTab(`phase_${activePhase.number + 1}`);
                  setViewMode('study');
                  setShowQuickCheckAnswer(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg flex items-center gap-2"
              >
                <span>Continue to Phase {activePhase.number + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setActiveTab('grand_quiz');
                  setViewMode('grand_intro');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Proceed to Grand Quiz (All 3 Phases)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: GRAND QUIZ INTRO CARD */}
      {viewMode === 'grand_intro' && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            Grand Mastery Quiz — Comprehensive Cross-Phase Assessment
          </h3>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Tests your understanding across <strong>Phase 1 (Foundation)</strong>,{' '}
            <strong>Phase 2 (Application)</strong>, and <strong>Phase 3 (Mastery)</strong> with{' '}
            <strong>{session.grandQuiz?.totalQuestions || 15} multiple-choice questions</strong>.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={startGrandQuiz}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-xl flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Grand Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 5: FINAL LEARNING ANALYSIS REPORT */}
      {viewMode === 'grand_report' && session.grandQuiz?.result && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Final Learning Diagnosis Report
              </span>
              <h3 className="text-base font-bold text-white">{session.title}</h3>
              <p className="text-sm text-slate-400">
                Overall Mastery Standing:{' '}
                <strong className="text-emerald-400">{session.grandQuiz.result.grade}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                <span className="text-xs text-slate-400 block">Final Grand Score</span>
                <span className="text-base font-bold text-emerald-300">
                  {session.grandQuiz.result.score} / {session.grandQuiz.result.total} ({session.grandQuiz.result.percentage}%)
                </span>
              </div>
              <button
                onClick={startGrandQuiz}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake Grand Quiz
              </button>
            </div>
          </div>

          {/* Phase-Wise Performance Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {session.grandQuiz.result.phaseWisePerformance.map((pw) => (
              <div
                key={pw.phase}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-sm font-bold text-white">
                  <span>Phase {pw.phase}</span>
                  <span className="text-indigo-300">
                    {pw.score}/{pw.total} ({pw.accuracy}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${pw.accuracy}%` }} />
                </div>
                <div className="text-xs text-slate-400 truncate">{pw.title}</div>
              </div>
            ))}
          </div>

          {/* Strongest vs Weakest Concepts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-sm font-bold text-emerald-400 block">
                Strongest Mastered Concepts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(session.grandQuiz.result.strongestConcepts.length > 0
                  ? session.grandQuiz.result.strongestConcepts
                  : ['Core Foundations']
                ).map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 text-xs"
                  >
                    ✓ {ContentSanitizer.cleanText(c)}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <span className="text-sm font-bold text-amber-400 block">
                Concepts Recommended for Review
              </span>
              {session.grandQuiz.result.weakestConcepts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {session.grandQuiz.result.weakestConcepts.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 text-xs"
                    >
                      • {ContentSanitizer.cleanText(c)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-emerald-300">
                  No conceptual gaps detected across the Grand Quiz.
                </span>
              )}
            </div>
          </div>

          {/* Recommended Revision & Next Topic */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-sm space-y-1.5">
            <div>
              <strong className="text-indigo-300">Recommended Next Step: </strong>
              <span className="text-slate-200">{session.grandQuiz.result.recommendedRevision}</span>
            </div>
            <div>
              <strong className="text-indigo-300">Suggested Continuation Topic: </strong>
              <span className="text-emerald-300 font-semibold">
                {session.grandQuiz.result.suggestedNextTopic}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
