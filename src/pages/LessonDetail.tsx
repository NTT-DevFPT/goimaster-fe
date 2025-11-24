import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Lesson, Word, QuizSessionResult, QuizSessionDetail } from '../types';
import { ArrowLeft, Layers, BrainCircuit, History, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiService } from '../services/api';
import { SessionDetailModal } from '../components/SessionDetailModal';

export const LessonDetail: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { getHistory } = useApp();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [history, setHistory] = useState<QuizSessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<QuizSessionResult | null>(null);
  const [sessionDetails, setSessionDetails] = useState<QuizSessionDetail[]>([]);

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
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/group/${lesson.groupId}`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{lesson.name}</h1>
          <p className="text-gray-500">{words.length} words in this set</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Study Card */}
        <Link to={`/lesson/${lessonId}/flashcards`} className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
          <Layers size={40} className="mb-4 text-blue-200" />
          <h2 className="text-2xl font-bold mb-2">Flashcards</h2>
          <p className="text-blue-100">Flip cards to memorize Kanji, Furigana, and Meanings at your own pace.</p>
          <div className="mt-6 bg-white/20 w-fit px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm group-hover:bg-white group-hover:text-blue-600 transition-colors">
            Start Practice
          </div>
        </Link>

        {/* Quiz Card */}
        <Link to={`/lesson/${lessonId}/quiz`} className="group bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
          <BrainCircuit size={40} className="mb-4 text-brand-200" />
          <h2 className="text-2xl font-bold mb-2">Take a Quiz</h2>
          <p className="text-brand-100">Test your knowledge with time-based random challenges.</p>
          <div className="mt-6 bg-white/20 w-fit px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm group-hover:bg-white group-hover:text-brand-600 transition-colors">
            Start Quiz
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Word List Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Word List</h3>
            <span className="text-sm text-gray-500">Preview</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {words.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No words imported yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-4 font-medium text-gray-500 text-sm">Kanji</th>
                    <th className="p-4 font-medium text-gray-500 text-sm">Furigana</th>
                    <th className="p-4 font-medium text-gray-500 text-sm">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {words.map((word) => (
                    <tr key={word.id} className="hover:bg-gray-50">
                      <td className="p-4 font-jp text-lg">{word.kanji}</td>
                      <td className="p-4 text-gray-600">{word.furigana}</td>
                      <td className="p-4 text-gray-800 font-medium">{word.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
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
              {history.slice(0, 3).map((h) => (
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
