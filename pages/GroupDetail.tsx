import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ImportExcel } from '../components/ImportExcel';
import { Lesson, Group } from '../types';
import { ArrowLeft, BookOpen, Clock, FileText, Plus } from 'lucide-react';
import clsx from 'clsx';

export const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { groups, getLessons, createLesson, addWordsToLesson } = useApp();
  const [group, setGroup] = useState<Group | undefined>(undefined);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [importedData, setImportedData] = useState<any[]>([]);

  useEffect(() => {
    if (groupId) {
      setGroup(groups.find(g => g.id === groupId));
      setLessons(getLessons(groupId));
    }
  }, [groupId, groups]);

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupId && newLessonName.trim()) {
      const lesson = createLesson(groupId, newLessonName);
      if (importedData.length > 0) {
        addWordsToLesson(lesson.id, importedData.map(row => ({
          kanji: row.kanji,
          hanViet: row.hanViet || '',
          furigana: row.furigana || '',
          meaning: row.meaning
        })));
      }
      setLessons(getLessons(groupId));
      
      // Reset
      setNewLessonName('');
      setImportedData([]);
      setIsModalOpen(false);
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
          onClick={() => setIsModalOpen(true)}
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
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    Ready to add {importedData.length} words to this lesson.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700"
                >
                  Create Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
