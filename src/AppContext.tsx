import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Group, Lesson, Word, WordStats, QuizSessionResult, User, StudyStreak } from './types';
import { apiService } from './services/api';
import { API_CONFIG } from './config/api';

type LessonWordPayload = Omit<Word, 'id' | 'lessonId'>;

interface AppContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  groups: Group[];
  refreshGroups: () => Promise<void>;
  getLessons: (groupId: string) => Promise<Lesson[]>;
  createGroup: (name: string, description?: string) => Promise<void>;
  createLesson: (
    groupId: string,
    name: string,
    options?: { orderIndex?: number; words?: LessonWordPayload[] }
  ) => Promise<Lesson>;
  addWordsToLesson: (lessonId: string, words: Omit<Word, 'id' | 'lessonId'>[]) => Promise<void>;
  getWords: (lessonId: string) => Promise<Word[]>;
  getStats: (lessonId: string) => Promise<Record<string, WordStats>>;
  updateStats: (lessonId: string, updates: WordStats[]) => Promise<void>;
  getHistory: (lessonId: string) => Promise<QuizSessionResult[]>;
  saveHistory: (lessonId: string, result: QuizSessionResult, details?: { wordId: string; isCorrect: boolean; kanji?: string; meaning?: string }[]) => Promise<void>;
  getStudyStreak: () => Promise<StudyStreak>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const AUTO_REFRESH_INTERVAL = 60_000; // 1 minute

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    try {
      const groupsData = await apiService.getGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadGroups();
      }
    };

    const handleFocus = () => loadGroups();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadGroups();
      }
    }, AUTO_REFRESH_INTERVAL);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, loadGroups]);

  // Initialize auth session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = apiService.getToken();
        const storedUser = apiService.getUser();
        
        if (token && storedUser) {
          // Verify token with backend
          const verifyResult = await apiService.verifyUser();
          
          if (verifyResult.valid) {
            setUser(storedUser);
            await loadGroups();
          } else {
            // Token invalid, clear storage
            apiService.clearAuth();
            setUser(null);
            setGroups([]);
          }
        } else {
          // No stored auth
          setUser(null);
          setGroups([]);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        apiService.clearAuth();
        setUser(null);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [loadGroups]);

  const login = async (email: string, password: string) => {
    const result = await apiService.login(email, password);
    
    // Store token and user
    apiService.setToken(result.token);
    apiService.setUser(result.user);
    
    setUser(result.user);
    await loadGroups();
  };

  const loginWithGoogle = async () => {
    throw new Error('Google login not yet implemented');
  };

  const checkEmailStatus = async (email: string) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`
      );
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (err) {
      console.warn('Unable to check email status:', err);
      return null;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const emailStatus = await checkEmailStatus(email);

    if (emailStatus?.exists) {
      if (emailStatus.confirmed && !emailStatus.deleted) {
        throw new Error('EMAIL_ALREADY_REGISTERED_CONFIRMED');
      }
      if (!emailStatus.confirmed && !emailStatus.deleted) {
        throw new Error('EMAIL_PENDING_CONFIRMATION');
      }
    }

    const result = await apiService.register(name, email, password);
    
    // Store token and user
    apiService.setToken(result.token);
    apiService.setUser(result.user);
    
    setUser(result.user);
    await loadGroups();
  };

  const logout = async () => {
    try {
      // Clear auth data
      apiService.clearAuth();
      sessionStorage.clear();

      // Clear app state immediately
      setUser(null);
      setGroups([]);

      // Small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force reload to ensure everything is cleared
      window.location.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state and redirect
      apiService.clearAuth();
      sessionStorage.clear();
      setUser(null);
      setGroups([]);
      window.location.replace('/');
    }
  };


  const refreshGroups = useCallback(async () => {
    await loadGroups();
  }, [loadGroups]);

  const createGroup = async (name: string, description?: string) => {
    await apiService.createGroup(name, description);
    await loadGroups();
  };

  const getLessons = async (groupId: string): Promise<Lesson[]> => {
    return await apiService.getLessons(groupId);
  };

  const createLesson = async (
    groupId: string,
    name: string,
    options?: { orderIndex?: number; words?: LessonWordPayload[] }
  ): Promise<Lesson> => {
    const lesson = await apiService.createLesson(
      groupId,
      name,
      options?.orderIndex,
      options?.words
    );
    await refreshGroups(); // Refresh to update lesson counts if needed
    return lesson;
  };

  const addWordsToLesson = async (lessonId: string, rawWords: Omit<Word, 'id' | 'lessonId'>[]) => {
    await apiService.createWords(lessonId, rawWords);
  };

  const getWords = async (lessonId: string): Promise<Word[]> => {
    return await apiService.getWords(lessonId);
  };

  const getStats = async (lessonId: string): Promise<Record<string, WordStats>> => {
    return await apiService.getWordStats(lessonId);
  };

  const updateStats = async (lessonId: string, updates: WordStats[]) => {
    await apiService.batchUpdateWordStats(updates);
  };

  const getHistory = async (lessonId: string): Promise<QuizSessionResult[]> => {
    return await apiService.getQuizSessions(lessonId);
  };

  const saveHistory = async (lessonId: string, result: QuizSessionResult, details?: { wordId: string; isCorrect: boolean; kanji?: string; meaning?: string }[]) => {
    await apiService.createQuizSession(
      lessonId,
      result.mode,
      result.durationSeconds,
      result.totalQuestions,
      result.correctAnswers,
      details
    );
  };

  const getStudyStreak = async (): Promise<StudyStreak> => {
    return await apiService.getStudyStreak();
  };

  return (
    <AppContext.Provider value={{
      user,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      groups,
      refreshGroups,
      getLessons,
      createGroup,
      createLesson,
      addWordsToLesson,
      getWords,
      getStats,
      updateStats,
      getHistory,
      saveHistory,
      getStudyStreak
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
