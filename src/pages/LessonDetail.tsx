import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Lesson, Word, QuizSessionResult, QuizSessionDetail } from '../types';
import { ArrowLeft, Layers, BrainCircuit, History, Trophy, Edit2, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiService } from '../services/api';
import { SessionDetailModal } from '../components/SessionDetailModal';
import { EditWordModal } from '../components/EditWordModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const LessonDetail: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { getHistory } = useApp();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [history, setHistory] = useState<QuizSessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<QuizSessionResult | null>(null);
  const [sessionDetails, setSessionDetails] = useState<QuizSessionDetail[]>([]);

  // Edit/Delete state
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [deletingWord, setDeletingWord] = useState<Word | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (lessonId) {
        try {
          setLoading(true);
          const [lessonData, wordsData, historyData] = await Promise.all([
            apiService.getLesson(lessonId),
            apiService.getWords(lessonId),
            getHistory(lessonId),
          ]);
          setLesson(lessonData);
          setWords(wordsData);
          setHistory(historyData);
        } catch (error) {
          console.error('Failed to load lesson data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [lessonId, getHistory]);

  const handleEditWord = async (wordData: { kanji: string; hanViet: string; furigana: string; meaning: string }) => {
    if (!editingWord) return;
    try {
      await apiService.updateWord(editingWord.id, wordData);
      // Refresh words
      const updatedWords = await apiService.getWords(lessonId!);
      setWords(updatedWords);
      setEditingWord(null);
    } catch (error) {
      console.error('Failed to update word:', error);
      alert('Failed to update word. Please try again.');
    }
  };

  const handleDeleteWord = async () => {
    if (!deletingWord || !lessonId) return;
    try {
      await apiService.deleteWord(deletingWord.id);
      // Refresh words
      const updatedWords = await apiService.getWords(lessonId);
      setWords(updatedWords);
      setDeletingWord(null);
    } catch (error) {
      console.error('Failed to delete word:', error);
      alert('Failed to delete word. Please try again.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!lesson) return <div className="p-8 text-center text-red-500">Lesson not found</div>;

  // Prepare chart data
  const chartData = history.slice(0, 5).reverse().map((h, i) => ({
    name: `Attempt ${history.length - 4 + i}`,
    score: Math.round((h.correctAnswers / (h.totalQuestions || 1)) * 100),
    date: new Date(h.date).toLocaleDateString()
  }));

  const handleSessionClick = async (session: QuizSessionResult) => {
    try {
      const fullSession = await apiService.getQuizSession(session.id);
      setSessionDetails(fullSession.details);
      setSelectedSession(session);
    } catch (error) {
      console.error('Failed to load session details:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/group/${lesson.groupId}`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{lesson.name}</h1>
          <p className="text-gray-500">{words.length} words in this set</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Card */}
        <Link to={`/lesson/${lessonId}/flashcards`} className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 lg:col-span-1">
          <Layers size={40} className="mb-4 text-blue-200" />
          <h2 className="text-2xl font-bold mb-2">Flashcards</h2>
          <p className="text-blue-100">Flip cards to memorize Kanji, Furigana, and Meanings at your own pace.</p>
          <div className="mt-6 bg-white/20 w-fit px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm group-hover:bg-white group-hover:text-blue-600 transition-colors">
            Start Practice
          </div>
        </Link>

        {/* Quiz Card */}
        <Link to={`/lesson/${lessonId}/quiz`} className="group bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 lg:col-span-1">
          <BrainCircuit size={40} className="mb-4 text-brand-200" />
          <h2 className="text-2xl font-bold mb-2">Take a Quiz</h2>
          <p className="text-brand-100">Test your knowledge with time-based random challenges.</p>
          <div className="mt-6 bg-white/20 w-fit px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm group-hover:bg-white group-hover:text-brand-600 transition-colors">
            Start Quiz
          </div>
        </Link>
        
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm text-gray-500">Overview</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">{words.length} words</h2>
          <p className="text-gray-500">in this lesson</p>
          <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-600 space-y-1">
            <p>Created: {new Date(lesson.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Word list full width */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Lesson Words</p>
            <h3 className="text-2xl font-bold text-gray-900">Word List</h3>
            <p className="text-sm text-gray-500">Scroll to view all words or edit/remove individual entries.</p>
          </div>
        </div>
        <div className="max-h-[520px] overflow-y-auto">
          {words.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No words imported yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 text-sm text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-12">#</th>
                  <th className="p-4">Kanji</th>
                  <th className="p-4">Furigana</th>
                  <th className="p-4">Meaning</th>
                  <th className="p-4 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {words.map((word, idx) => (
                  <tr key={word.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="p-4 font-jp text-lg">{word.kanji}</td>
                    <td className="p-4 text-gray-600 font-jp">{word.furigana}</td>
                    <td className="p-4 text-gray-800 font-medium">{word.meaning}</td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setEditingWord(word)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit word"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingWord(word)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete word"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={20} /> Performance
            </h3>
            {history.length > 0 ? (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" hide />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#22c55e' : entry.score > 50 ? '#eab308' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No quiz history available yet.</p>
            )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <History className="text-blue-500" size={20} /> Recent Activity
          </h3>
          <div className="space-y-3">
            {history.slice(0, 5).map((h) => (
              <div
                key={h.id}
                onClick={() => handleSessionClick(h)}
                className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800">{h.mode}</p>
                  <p className="text-gray-400 text-xs">{new Date(h.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600">{h.correctAnswers} / {h.totalQuestions}</p>
                </div>
              </div>
            ))}
            {history.length === 0 && <p className="text-gray-500 text-sm">Start a quiz to track progress!</p>}
          </div>
        </div>
      </div>

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          details={sessionDetails}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};
