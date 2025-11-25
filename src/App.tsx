import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { GroupDetail } from './pages/GroupDetail';
import { LessonDetail } from './pages/LessonDetail';
import { FlashcardSession } from './pages/FlashcardSession';
import { QuizSession } from './pages/QuizSession';
import { MyVocabulary } from './pages/MyVocabulary';
import { AdminVocabulary } from './pages/AdminVocabulary';
import { Auth } from './pages/Auth';

const AppContent: React.FC = () => {
  const { user, loading } = useApp();
  // const user = { name: 'Test User', email: 'test@example.com' }; // Mock user for verification
  // const loading = false;

  // Check for required environment variables
  const missingEnvVars = [];
  if (!import.meta.env.VITE_API_BASE_URL) missingEnvVars.push('VITE_API_BASE_URL');

  if (missingEnvVars.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border-l-4 border-red-500">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-slate-600 mb-4">The following environment variables are missing:</p>
          <ul className="list-disc list-inside bg-red-50 p-4 rounded-lg text-red-700 font-mono text-sm mb-6">
            {missingEnvVars.map(env => (
              <li key={env}>{env}</li>
            ))}
          </ul>
          <p className="text-slate-500 text-sm">Please check your <code className="bg-slate-100 px-2 py-1 rounded">.env</code> file.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/group/:groupId" element={<GroupDetail />} />
        <Route path="/lesson/:lessonId" element={<LessonDetail />} />
        <Route path="/lesson/:lessonId/flashcards" element={<FlashcardSession />} />
        <Route path="/lesson/:lessonId/quiz" element={<QuizSession />} />
        <Route path="/my-vocabulary" element={<MyVocabulary />} />
        <Route path="/admin/vocabulary" element={<AdminVocabulary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </HashRouter>
  );
}

export default App;