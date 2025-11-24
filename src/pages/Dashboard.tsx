import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Link } from 'react-router-dom';
import { Folder, Plus, ChevronRight, BookOpen, Sparkles, Activity, Clock } from 'lucide-react';
import { StudyStreakWidget } from '../components/StudyStreakWidget';

export const Dashboard: React.FC = () => {
  const { groups, createGroup } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      try {
        await createGroup(newGroupName);
        setNewGroupName('');
        setIsModalOpen(false);
      } catch (error: any) {
        console.error('Failed to create group:', error);
        const errorMessage = error?.response?.data?.error
          || error?.response?.data?.name
          || error?.message
          || 'Failed to create group. Please try again.';
        alert(errorMessage);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-xl shadow-brand-200/50">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-accent-500 opacity-20 rounded-full blur-2xl"></div>

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
                Welcome back! <Sparkles className="text-yellow-300" />
              </h2>
              <p className="text-brand-50 text-lg opacity-90 leading-relaxed">
                Ready to master new Kanji today? Your journey to fluency continues here.
              </p>

              <div className="mt-8 flex gap-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <Activity size={18} className="text-brand-200" />
                  <span className="font-medium">Level N3</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <Clock size={18} className="text-brand-200" />
                  <span className="font-medium">15 min today</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Study Streak Widget - Desktop only */}
        <div className="hidden lg:block">
          <StudyStreakWidget />
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-brand-600" size={28} />
            My Groups
          </h3>
          <p className="text-slate-500 mt-1">Manage your vocabulary collections</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-brand-200/50 transition-all hover:-translate-y-1 hover:shadow-xl"
        >
          <Plus size={20} />
          New Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <Link
            key={group.id}
            to={`/group/${group.id}`}
            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-brand-200 transition-all duration-300 relative overflow-hidden flex flex-col h-full"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
              <ChevronRight className="text-brand-500" />
            </div>

            <div className="flex items-start justify-between mb-6">
              <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <Folder size={28} />
              </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-brand-700 transition-colors">{group.name}</h3>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400 font-medium">View lessons</p>
                <span className="w-8 h-1 bg-slate-100 rounded-full group-hover:bg-brand-200 transition-colors"></span>
              </div>
            </div>
          </Link>
        ))}

        {groups.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 hover:border-brand-200 transition-colors">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Folder className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700 mb-3">No groups yet</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto text-lg">Create a group like "JLPT N3" or "Core 2000" to organize your vocabulary.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-brand-600 font-bold hover:text-brand-700 hover:underline text-lg"
            >
              Create your first group
            </button>
          </div>
        )}
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100 animate-slide-up border border-white/20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Create New Group</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. JLPT N3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-medium text-lg placeholder:text-slate-300"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all hover:-translate-y-0.5"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};