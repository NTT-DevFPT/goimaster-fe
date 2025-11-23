import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, BarChart2, Languages, LogOut, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../AppContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Sidebar / Mobile Nav */}
      <nav className="bg-white md:w-72 border-b md:border-r border-slate-200 p-6 flex md:flex-col justify-between items-center md:items-stretch sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-0 md:mb-10 cursor-pointer">
          <div className="bg-gradient-to-br from-brand-600 to-accent-600 p-2.5 rounded-xl shadow-lg shadow-brand-200">
            <Languages className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent tracking-tight">
              GoiMaster
            </h1>
            <p className="text-xs text-slate-400 font-medium hidden md:block">Japanese Vocabulary</p>
          </div>
        </div>

        <div className="flex md:flex-col gap-2 w-full">
          <Link to="/" className={clsx(
            "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium",
            location.pathname === "/" 
              ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}>
            <Home size={20} />
            <span className="hidden md:inline">Dashboard</span>
          </Link>
          
          <div className={clsx(
            "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium cursor-not-allowed opacity-50",
            "text-slate-400"
          )}>
            <BarChart2 size={20} />
            <span className="hidden md:inline">Analytics</span>
          </div>
        </div>
        
        <div className="hidden md:block mt-auto space-y-4">
            {/* Streak Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white">
                <p className="text-sm font-medium opacity-80 mb-1">Study Streak</p>
                <div className="text-2xl font-bold mb-2">3 Days</div>
                <div className="flex gap-1">
                    {[1,1,1,0,0,0,0].map((active, i) => (
                        <div key={i} className={`h-2 w-full rounded-full ${active ? 'bg-green-400' : 'bg-white/20'}`}></div>
                    ))}
                </div>
            </div>

            {/* User Profile & Logout */}
            <div className="border-t border-slate-100 pt-4 mt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                            {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate w-24">{user?.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={logout}
                        title="Sign Out"
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full animate-fade-in">
        {children}
      </main>
    </div>
  );
};