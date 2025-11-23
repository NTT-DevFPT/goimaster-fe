import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { GroupDetail } from './pages/GroupDetail';
import { LessonDetail } from './pages/LessonDetail';
import { FlashcardSession } from './pages/FlashcardSession';
import { QuizSession } from './pages/QuizSession';
import { Auth } from './pages/Auth';

const AppContent: React.FC = () => {
  const { user } = useApp();

  if (!user) {
    return <Auth />;
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/group/:groupId" element={<GroupDetail />} />
          <Route path="/lesson/:lessonId" element={<LessonDetail />} />
          <Route path="/lesson/:lessonId/flashcards" element={<FlashcardSession />} />
          <Route path="/lesson/:lessonId/quiz" element={<QuizSession />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;