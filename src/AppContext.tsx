import React, { createContext, useContext, useState, useEffect } from 'react';
import { Group, Lesson, Word, WordStats, QuizSessionResult, User, StudyStreak } from './types';
import { supabase } from './config/supabase';
import { apiService } from './services/api';
import { API_CONFIG } from './config/api';

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
  createLesson: (groupId: string, name: string) => Promise<Lesson>;
  addWordsToLesson: (lessonId: string, words: Omit<Word, 'id' | 'lessonId'>[]) => Promise<void>;
  getWords: (lessonId: string) => Promise<Word[]>;
  getStats: (lessonId: string) => Promise<Record<string, WordStats>>;
  updateStats: (lessonId: string, updates: WordStats[]) => Promise<void>;
  getHistory: (lessonId: string) => Promise<QuizSessionResult[]>;
  saveHistory: (lessonId: string, result: QuizSessionResult, details?: { wordId: string; isCorrect: boolean; kanji?: string; meaning?: string }[]) => Promise<void>;
  getStudyStreak: () => Promise<StudyStreak>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize auth session
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        // Clear any corrupted session data
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setGroups([]);
        setLoading(false);
        return;
      }

      if (session?.user) {
        // CRITICAL: Verify user with backend to ensure user still exists in database
        try {
          // First verify with backend API (checks if user exists in database)
          const verifyResult = await apiService.verifyUser();

          if (!verifyResult.valid) {
            // User not found in database or authentication failed
            console.error('User verification failed:', verifyResult.message);
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
            setUser(null);
            setGroups([]);
            setLoading(false);
            return;
          }

          // User verified with backend, now get user details from Supabase
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

          if (userError || !currentUser) {
            // Token might be invalid
            console.log('Supabase auth error, clearing session');
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
            setUser(null);
            setGroups([]);
          } else {
            // User exists and verified, set user data
            setUser({
              id: currentUser.id,
              email: currentUser.email || '',
              name: currentUser.user_metadata?.name || currentUser.email || '',
            });
            loadGroups();
          }
        } catch (err: any) {
          console.error('Error verifying user:', err);
          // If verification fails, force logout
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          setUser(null);
          setGroups([]);
        }
      } else {
        // No session, ensure clean state
        setUser(null);
        setGroups([]);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // CRITICAL: Always verify with backend when auth state changes
        try {
          // Verify user with backend API (checks if user exists in database)
          const verifyResult = await apiService.verifyUser();

          if (!verifyResult.valid) {
            // User not found in database, force logout
            console.error('User verification failed on auth change:', verifyResult.message);
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
            setUser(null);
            setGroups([]);
            setLoading(false);
            return;
          }

          // User verified, get details from Supabase
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

          if (userError || !currentUser) {
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
            setUser(null);
            setGroups([]);
          } else {
            setUser({
              id: currentUser.id,
              email: currentUser.email || '',
              name: currentUser.user_metadata?.name || currentUser.email || '',
            });
            loadGroups();
          }
        } catch (err) {
          console.error('Error verifying user on auth change:', err);
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          setUser(null);
          setGroups([]);
        }
      } else {
        setUser(null);
        setGroups([]);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadGroups = async () => {
    try {
      const groupsData = await apiService.getGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const identities = data.user?.identities;

    if (identities && Array.isArray(identities) && identities.length === 0) {
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }

    if (error) {
      if (error.message?.toLowerCase().includes('already registered')) {
        throw new Error('EMAIL_ALREADY_REGISTERED');
      }
      throw error;
    }
    if (!data.user) throw new Error('Login failed');

    setUser({
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name || data.user.email || '',
    });

    await loadGroups();
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/#/`,
      },
    });

    if (error) throw error;
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${window.location.origin}/#/auth`,
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Registration failed');

    // Supabase only returns a session immediately if email confirmations are disabled.
    // Attempt to sign the user in automatically; if that fails, ask them to verify email.
    if (!data.session) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError || !loginData.session || !loginData.user) {
        throw new Error(
          'Registration successful. Please confirm the verification email before signing in (or disable email confirmations in Supabase Auth settings for local dev).'
        );
      }

      setUser({
        id: loginData.user.id,
        email: loginData.user.email || '',
        name: loginData.user.user_metadata?.name || name,
      });
    } else {
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || name,
      });
    }

    await loadGroups();
  };

  const logout = async () => {
    try {
      // Sign out from Supabase (this should clear the session)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }

      // Clear ALL localStorage items that start with 'sb-' (Supabase prefix)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';

      Object.keys(localStorage).forEach(key => {
        // Clear all Supabase-related keys
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
        // Also clear by project ref if available
        if (projectRef && key.includes(projectRef)) {
          localStorage.removeItem(key);
        }
      });

      // Clear all sessionStorage
      sessionStorage.clear();

      // Clear app state immediately
      setUser(null);
      setGroups([]);

      // Small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force reload to ensure everything is cleared
      // Use window.location.replace to prevent back button navigation
      window.location.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state and redirect
      setUser(null);
      setGroups([]);
      // Clear all storage anyway
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
    }
  };


  const refreshGroups = async () => {
    await loadGroups();
  };

  const createGroup = async (name: string, description?: string) => {
    await apiService.createGroup(name, description);
    await loadGroups();
  };

  const getLessons = async (groupId: string): Promise<Lesson[]> => {
    return await apiService.getLessons(groupId);
  };

  const createLesson = async (groupId: string, name: string): Promise<Lesson> => {
    const lesson = await apiService.createLesson(groupId, name);
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
