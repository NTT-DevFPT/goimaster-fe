import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, BarChart2, Languages, LogOut, User as UserIcon, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../AppContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useApp();

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Sidebar / Mobile Nav */}
      <nav className="bg-white/80 backdrop-blur-xl md:w-72 border-b md:border-r border-slate-200 p-6 flex md:flex-col justify-between items-center md:items-stretch sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-0 md:mb-10 cursor-pointer group">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-2.5 rounded-xl shadow-lg shadow-brand-200/50 group-hover:scale-105 transition-transform">
            <Languages className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-700 to-brand-900 bg-clip-text text-transparent tracking-tight">
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

          <Link to="/my-vocabulary" className={clsx(
            "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium",
            location.pathname === "/my-vocabulary"
              ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}>
            <BookOpen size={20} />
            <span className="hidden md:inline">My Vocabulary</span>
          </Link>

          {/* Admin-only menu */}
          {user?.email === 'goimaster@gmail.com' && (
            <Link to="/admin/vocabulary" className={clsx(
              "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium border",
              location.pathname === "/admin/vocabulary"
                ? "bg-red-50 text-red-700 shadow-sm border-red-200"
                : "text-red-600 hover:bg-red-50 border-red-200"
            )}>
              <Settings size={20} />
              <span className="hidden md:inline">Admin Panel</span>
            </Link>
          )}

          <div className={clsx(
            "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium cursor-not-allowed opacity-50",
            "text-slate-400"
          )}>
            <BarChart2 size={20} />
            <span className="hidden md:inline">Analytics</span>
          </div>
        </div>

        <div className="hidden md:block mt-auto space-y-4">
          {/* User Profile & Logout */}
          <div className="border-t border-slate-100 pt-4 mt-4">
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 flex items-center justify-center font-bold shadow-inner">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate group-hover:text-brand-700 transition-colors">{user?.name}</p>
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
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <footer className="px-8 py-4 text-center text-slate-400 text-sm border-t border-slate-100 bg-white/60 backdrop-blur">
          <p>© {new Date().getFullYear()} GoiMaster. Developed by <a href="https://github.com/NTT-DevFPT" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 font-medium transition-colors">NTT-DevFPT</a>.</p>
        </footer>
      </div>
    </div>
  );
};