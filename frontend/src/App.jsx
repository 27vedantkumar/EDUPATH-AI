import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { IngestionModal } from './components/common/IngestionModal';

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
        return <DashboardPage onNavigate={setCurrentTab} />;
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

  return (
    <div
      style={{ backgroundColor: themeConfig.bgCanvas }}
      className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200"
    >
      <Navbar onOpenUpload={() => setIsUploadOpen(true)} onSelectTab={setCurrentTab} currentTab={currentTab} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="flex-1 overflow-y-auto">
          {renderActivePage()}
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
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
