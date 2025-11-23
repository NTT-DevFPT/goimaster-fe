import React, { createContext, useContext, useState, useEffect } from 'react';
import { Group, Lesson, Word, WordStats, QuizSessionResult, User } from './types';
import { StorageService, AuthService } from './services/storage';

interface AppContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  groups: Group[];
  refreshGroups: () => void;
  getLessons: (groupId: string) => Lesson[];
  createGroup: (name: string) => void;
  createLesson: (groupId: string, name: string) => Lesson;
  addWordsToLesson: (lessonId: string, words: Omit<Word, 'id' | 'lessonId'>[]) => void;
  getWords: (lessonId: string) => Word[];
  getStats: () => Record<string, WordStats>;
  updateStats: (updates: WordStats[]) => void;
  getHistory: (lessonId: string) => QuizSessionResult[];
  saveHistory: (result: QuizSessionResult) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<Record<string, WordStats>>({});

  useEffect(() => {
    // Check for logged in user
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      refreshGroups();
      setStats(StorageService.getStats());
    }
  }, []);

  const login = async (email: string, password: string) => {
    const user = await AuthService.login(email, password);
    setUser(user);
    refreshGroups();
  };

  const loginWithGoogle = async () => {
    const user = await AuthService.loginWithGoogle();
    setUser(user);
    refreshGroups();
  };

  const register = async (name: string, email: string, password: string) => {
    const user = await AuthService.register({ name, email, password });
    setUser(user);
    refreshGroups();
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setGroups([]);
  };

  const refreshGroups = () => {
    setGroups(StorageService.getGroups());
  };

  const createGroup = (name: string) => {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
    };
    StorageService.saveGroup(newGroup);
    refreshGroups();
  };

  const createLesson = (groupId: string, name: string) => {
    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      groupId,
      name,
      wordCount: 0,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveLesson(newLesson);
    return newLesson;
  };

  const addWordsToLesson = (lessonId: string, rawWords: Omit<Word, 'id' | 'lessonId'>[]) => {
    const words: Word[] = rawWords.map(w => ({
      ...w,
      id: crypto.randomUUID(),
      lessonId,
    }));
    StorageService.saveWords(words);
  };

  const getLessons = (groupId: string) => StorageService.getLessons(groupId);
  const getWords = (lessonId: string) => StorageService.getWords(lessonId);
  const getHistory = (lessonId: string) => StorageService.getHistory(lessonId);

  const updateStats = (updates: WordStats[]) => {
    StorageService.updateWordStats(updates);
    setStats(StorageService.getStats());
  };

  const saveHistory = (result: QuizSessionResult) => {
    StorageService.saveHistory(result);
  };

  return (
    <AppContext.Provider value={{
      user,
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
      getStats: () => stats,
      updateStats,
      getHistory,
      saveHistory
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