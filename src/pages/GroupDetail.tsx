import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ImportExcel } from '../components/ImportExcel';
import { Lesson, Group, ExcelRow } from '../types';
import { ArrowLeft, BookOpen, Clock, FileText, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { EditNameModal } from '../components/EditNameModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { groups, getLessons, createLesson } = useApp();
  const [group, setGroup] = useState<Group | undefined>(undefined);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [importedData, setImportedData] = useState<ExcelRow[]>([]);
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState<{ id: string; name: string } | null>(null);

  const handleRemoveImportedWord = (index: number) => {
    setImportedData(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleClearImportedWords = () => {
    setImportedData([]);
  };

  useEffect(() => {
    const loadData = async () => {
      if (groupId) {
        const foundGroup = groups.find(g => g.id === groupId);
        setGroup(foundGroup);
        if (foundGroup) {
          const lessonsData = await getLessons(groupId);
          setLessons(lessonsData);
        }
      }
    };
    loadData();
  }, [groupId, groups, getLessons]);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (groupId && newLessonName.trim()) {
      setCreatingLesson(true);
      try {
        const lesson = await createLesson(groupId, newLessonName.trim(), {
          words: importedData.map(row => ({
            kanji: row.kanji,
            hanViet: row.hanViet || '',
            furigana: row.furigana || '',
            meaning: row.meaning
          }))
        });
        const lessonsData = await getLessons(groupId);
        setLessons(lessonsData);
        setNewLessonName('');
        setImportedData([]);
        setCreationSuccess({ id: lesson.id, name: lesson.name });
      } catch (error) {
        console.error('Failed to create lesson:', error);
        alert('Failed to create lesson. Please try again.');
      } finally {
        setCreatingLesson(false);
      }
    }
  };

  if (!group) return <div className="p-8">Group not found</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-gray-500">{lessons.length} lessons available</p>
        </div>
        <button
          onClick={() => {
            setCreationSuccess(null);
            setImportedData([]);
            setNewLessonName('');
            setIsModalOpen(true);
          }}
          className="ml-auto bg-brand-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:bg-brand-700"
        >
          <Plus size={18} />
          Add Lesson
        </button>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/lesson/${lesson.id}`}
            className="block bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-brand-200 transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{lesson.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText size={14} /> {lesson.wordCount} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Created {new Date(lesson.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                Start Learning
              </div>
            </div>
          </Link>
        ))}

        {lessons.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-gray-500">No lessons created yet.</p>
          </div>
        )}
      </div>

      {/* Create Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Lesson</h2>
            {creationSuccess && (
              <div className="mb-5 p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 mt-0.5 text-emerald-500" />
                  <div>
                    <p className="font-semibold">Lesson created successfully</p>
                    <p className="text-sm text-emerald-600">
                      "{creationSuccess.name}" is ready. You can open it now or continue adding another lesson.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const lessonId = creationSuccess.id;
                          setIsModalOpen(false);
                          setCreationSuccess(null);
                          navigate(`/lesson/${lessonId}`);
                        }}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Go to lesson
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreationSuccess(null)}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      >
                        Create another
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleCreateLesson}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Name</label>
                <input
                  type="text"
                  value={newLessonName}
                  onChange={(e) => setNewLessonName(e.target.value)}
                  placeholder="e.g. Unit 1: Vocabulary"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Import Words (Excel)</label>
                <ImportExcel onImport={(data) => setImportedData(data)} />
                {importedData.length > 0 && (
                  <div className="mt-4 border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Preview {importedData.length} imported word{importedData.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500">Double-check before creating the lesson</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearImportedWords}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto bg-white">
                      <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-white shadow-sm">
                          <tr className="text-left text-gray-500 uppercase text-xs tracking-wide">
                            <th className="px-3 py-2 w-10">#</th>
                            <th className="px-3 py-2 font-jp">漢字</th>
                            <th className="px-3 py-2">Hán Việt</th>
                            <th className="px-3 py-2 font-jp">読み方</th>
                            <th className="px-3 py-2 font-jp">意味</th>
                            <th className="px-3 py-2 w-12 text-center"> </th>
                          </tr>
                        </thead>
                        <tbody>
                          {importedData.map((row, index) => (
                            <tr
                              key={`${row.kanji}-${row.meaning}-${index}`}
                              className="border-t border-gray-100 text-gray-700"
                            >
                              <td className="px-3 py-2 text-xs text-gray-400">{index + 1}</td>
                              <td className="px-3 py-2 font-medium font-jp">{row.kanji}</td>
                              <td className="px-3 py-2">{row.hanViet || <span className="text-gray-400">—</span>}</td>
                              <td className="px-3 py-2 font-jp">{row.furigana || <span className="text-gray-400">—</span>}</td>
                              <td className="px-3 py-2 text-gray-600">{row.meaning}</td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImportedWord(index)}
                                  className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  aria-label="Remove word"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setCreationSuccess(null);
                  }}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLesson}
                  className="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creatingLesson ? 'Creating...' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
