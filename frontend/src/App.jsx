import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth, AuthState } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { IngestionModal } from './components/common/IngestionModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthPage } from './pages/AuthPage';
import { FloatingStudyBuddy } from './components/common/FloatingStudyBuddy';
import { Sparkles } from 'lucide-react';

import { DashboardPage } from './pages/DashboardPage';
import { GroundedTutorPage } from './pages/GroundedTutorPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { SourceExplorerPage } from './pages/SourceExplorerPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { PlannerPage } from './pages/PlannerPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { ExamPage } from './pages/ExamPage';
import { CodingLabPage } from './pages/CodingLabPage';
import { GamesPage } from './pages/GamesPage';

const AppContent = () => {
  const { themeConfig } = useTheme();
  const { authState, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tutorContext, setTutorContext] = useState(null);
  const [sourceContext, setSourceContext] = useState(null);

  const handleNavigateWithContext = (tab, ctx = {}) => {
    if (tab === 'tutor') {
      setTutorContext(ctx);
    } else if (tab === 'sources') {
      setSourceContext(ctx);
    }
    setCurrentTab(tab);
  };

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={setCurrentTab}
            onNavigateWithContext={handleNavigateWithContext}
          />
        );
      case 'tutor':
        return (
          <GroundedTutorPage
            onNavigateToSource={(citation) => {
              setSourceContext({ document: citation?.document });
              setCurrentTab('sources');
            }}
            onNavigateTab={setCurrentTab}
            onOpenUpload={() => setIsUploadOpen(true)}
            initialContext={tutorContext}
            onClearContext={() => setTutorContext(null)}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'graph':
        return (
          <KnowledgeGraphPage
            key={`graph-${refreshTrigger}`}
            onAskConcept={(concept) => {
              setTutorContext({
                initialQuery: `Explain the concept "${concept?.name || 'Safe State'}" and how it connects to its prerequisites in the Knowledge Graph.`
              });
              setCurrentTab('tutor');
            }}
            onPracticeConcept={() => setCurrentTab('assessment')}
          />
        );
      case 'sources':
        return (
          <SourceExplorerPage
            onAskAboutSource={(ctx) => {
              setTutorContext(ctx);
              setCurrentTab('tutor');
            }}
            onOpenUpload={() => setIsUploadOpen(true)}
            initialSourceContext={sourceContext}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'assessment':
        return (
          <AssessmentsPage
            key={`assess-${refreshTrigger}`}
            onAskTutorAboutMistake={(question) => {
              setTutorContext({
                initialQuery: question?.question
                  ? `Why was I wrong on this question: "${question.question}"? Explain the misconception and correct principle.`
                  : "Explain the difference between an Unsafe State and a Deadlock so I don't confuse them."
              });
              setCurrentTab('tutor');
            }}
          />
        );
      case 'planner':
        return <PlannerPage onNavigateToTopic={() => setCurrentTab('sources')} />;
      case 'flashcards':
        return <FlashcardsPage key={`fc-${refreshTrigger}`} />;
      case 'exams':
        return <ExamPage />;
      case 'coding':
        return <CodingLabPage />;
      case 'games':
        return <GamesPage />;
      default:
        return <DashboardPage onNavigate={setCurrentTab} />;
    }
  };

  if (authState === AuthState.AUTH_LOADING) {
    return (
      <div
        style={{ backgroundColor: themeConfig.bgCanvas }}
        className="min-h-screen flex flex-col items-center justify-center font-sans transition-colors duration-200"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 animate-pulse">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">EduPath AI</h1>
            <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              v2026
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            Initializing secure learning environment...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div
      style={{ backgroundColor: themeConfig.bgCanvas }}
      className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200"
    >
      <Navbar onOpenUpload={() => setIsUploadOpen(true)} onSelectTab={setCurrentTab} currentTab={currentTab} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary onReset={() => setCurrentTab('dashboard')}>
            {renderActivePage()}
          </ErrorBoundary>
        </main>
      </div>

      <IngestionModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
        onNavigateWithContext={handleNavigateWithContext}
      />

      <FloatingStudyBuddy onNavigateToTutor={setCurrentTab} />
    </div>
  );
};

export default function App() {
  useEffect(() => {
    // Seed data only on absolute first load
    if (!localStorage.getItem('eduPath_seeded')) {
      // Inject fake session history
      localStorage.setItem('STORAGE_KEY_SESSIONS', JSON.stringify([
        { id: 'seq_1', course: 'Operating Systems', topic: 'Virtual Memory', score: 85, date: new Date(Date.now() - 86400000).toISOString() },
        { id: 'seq_2', course: 'Algorithms', topic: 'Dynamic Programming', score: 92, date: new Date().toISOString() }
      ]));

      // Inject fake global stats
      localStorage.setItem('USER_MASTERY_SCORE', '78');
      localStorage.setItem('TOTAL_QUESTIONS_EXPLORED', '142');
      localStorage.setItem('edupath_questions_asked_count_v1', '142');

      // Ensure demo user is available so the evaluator experiences the dashboard immediately
      if (!localStorage.getItem('edupath_authenticated_user_v1')) {
        localStorage.setItem('edupath_authenticated_user_v1', JSON.stringify({
          id: 'demo_alex_rivera',
          username: 'alex_rivera',
          full_name: 'Alex Rivera',
          email: 'alex.rivera@edupath.ai',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
          is_demo_user: true,
          email_verified: true
        }));
      }

      // Mark as seeded so we don't overwrite real progress later
      localStorage.setItem('eduPath_seeded', 'true');

      // Force a fast reload to populate the UI hooks
      window.location.reload();
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
