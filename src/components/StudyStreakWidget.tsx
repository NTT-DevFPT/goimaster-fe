import React, { useEffect, useState } from 'react';
import { useApp } from '../AppContext';
import { StudyStreak } from '../types';

export const StudyStreakWidget: React.FC = () => {
  const { getStudyStreak } = useApp();
  const [streak, setStreak] = useState<StudyStreak>({ currentStreak: 0, last7Days: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const streakData = await getStudyStreak();
        setStreak(streakData);
      } catch (error) {
        console.error('Failed to load study streak:', error);
        setStreak({ currentStreak: 0, last7Days: [false, false, false, false, false, false, false] });
      } finally {
        setLoading(false);
      }
    };
    loadStreak();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadStreak, 30000);
    return () => clearInterval(interval);
  }, [getStudyStreak]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white">
        <p className="text-sm font-medium opacity-80 mb-1">Study Streak</p>
        <div className="text-2xl font-bold mb-2">Loading...</div>
        <div className="flex gap-1">
          {[0,0,0,0,0,0,0].map((_, i) => (
            <div key={i} className="h-2 w-full rounded-full bg-white/20 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white">
      <p className="text-sm font-medium opacity-80 mb-1">Study Streak</p>
      <div className="text-2xl font-bold mb-2">
        {streak.currentStreak} {streak.currentStreak === 1 ? 'Day' : 'Days'}
      </div>
      <div className="flex gap-1">
        {(streak.last7Days.length > 0 ? streak.last7Days : [false, false, false, false, false, false, false]).map((active, i) => (
          <div 
            key={i} 
            className={`h-2 w-full rounded-full transition-all ${
              active ? 'bg-green-400' : 'bg-white/20'
            }`}
            title={`${active ? 'Studied' : 'Not studied'}`}
          ></div>
        ))}
      </div>
    </div>
  );
};


