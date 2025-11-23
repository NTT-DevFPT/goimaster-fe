import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Link } from 'react-router-dom';
import { Folder, Plus, ChevronRight, BookOpen, Sparkles } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { groups, createGroup } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      createGroup(newGroupName);
      setNewGroupName('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-accent-600 p-8 text-white shadow-xl shadow-brand-200">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                Welcome back! <Sparkles className="text-yellow-300" />
            </h2>
            <p className="text-brand-100 text-lg opacity-90">
                Ready to master new Kanji today? Select a group below to continue your journey.
            </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-brand-600" size={24} />
            My Groups
        </h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-md shadow-brand-200 transition-all hover:-translate-y-0.5"
        >
          <Plus size={18} />
          New Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <Link 
            key={group.id} 
            to={`/group/${group.id}`}
            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-brand-200 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                <ChevronRight className="text-brand-500" />
            </div>
            
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
                <Folder size={28} />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-1">{group.name}</h3>
            <p className="text-sm text-slate-400 font-medium">Tap to view lessons</p>
          </Link>
        ))}

        {groups.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No groups yet</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">Create a group like "JLPT N3" or "Core 2000" to organize your vocabulary.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-brand-600 font-bold hover:underline"
            >
              Create your first group
            </button>
          </div>
        )}
      </div>

      {/* Simple Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Create New Group</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Group Name</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. JLPT N3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-medium text-lg"
                    autoFocus
                  />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all"
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