import React, { useState } from 'react';
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
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentTab} />;
      case 'tutor':
        return <GroundedTutorPage onNavigateToSource={() => setCurrentTab('sources')} />;
      case 'graph':
        return (
          <KnowledgeGraphPage
            onAskConcept={(concept) => setCurrentTab('tutor')}
            onPracticeConcept={(concept) => setCurrentTab('assessment')}
          />
        );
      case 'sources':
        return <SourceExplorerPage onAskAboutSource={() => setCurrentTab('tutor')} />;
      case 'assessment':
        return <AssessmentsPage onAskTutorAboutMistake={() => setCurrentTab('tutor')} />;
      case 'planner':
        return <PlannerPage onNavigateToTopic={() => setCurrentTab('sources')} />;
      case 'flashcards':
        return <FlashcardsPage />;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onOpenUpload={() => setIsUploadOpen(true)} />
      
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
          // Re-render or refresh data
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
