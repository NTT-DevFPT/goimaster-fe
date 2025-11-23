import { Group, Lesson, Word, WordStats, QuizSessionResult, User } from '../types';

// Keys for LocalStorage
const KEYS = {
  GROUPS: 'nihongo_groups',
  LESSONS: 'nihongo_lessons',
  WORDS: 'nihongo_words',
  STATS: 'nihongo_stats',
  HISTORY: 'nihongo_history',
  USERS: 'nihongo_users',
  CURRENT_USER: 'nihongo_current_user',
};

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const StorageService = {
  // --- Groups ---
  getGroups: (): Group[] => {
    return JSON.parse(localStorage.getItem(KEYS.GROUPS) || '[]');
  },
  saveGroup: (group: Group) => {
    const groups = StorageService.getGroups();
    groups.push(group);
    localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
  },

  // --- Lessons ---
  getLessons: (groupId: string): Lesson[] => {
    const lessons: Lesson[] = JSON.parse(localStorage.getItem(KEYS.LESSONS) || '[]');
    return lessons.filter((l) => l.groupId === groupId);
  },
  saveLesson: (lesson: Lesson) => {
    const lessons: Lesson[] = JSON.parse(localStorage.getItem(KEYS.LESSONS) || '[]');
    lessons.push(lesson);
    localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons));
  },

  // --- Words ---
  getWords: (lessonId: string): Word[] => {
    const words: Word[] = JSON.parse(localStorage.getItem(KEYS.WORDS) || '[]');
    return words.filter((w) => w.lessonId === lessonId);
  },
  saveWords: (newWords: Word[]) => {
    const words: Word[] = JSON.parse(localStorage.getItem(KEYS.WORDS) || '[]');
    const updatedWords = [...words, ...newWords];
    localStorage.setItem(KEYS.WORDS, JSON.stringify(updatedWords));

    // Update lesson word count
    if (newWords.length > 0) {
      const lessons: Lesson[] = JSON.parse(localStorage.getItem(KEYS.LESSONS) || '[]');
      const lessonIndex = lessons.findIndex((l) => l.id === newWords[0].lessonId);
      if (lessonIndex >= 0) {
        lessons[lessonIndex].wordCount += newWords.length;
        localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons));
      }
    }
  },

  // --- Stats & History ---
  getStats: (): Record<string, WordStats> => {
    return JSON.parse(localStorage.getItem(KEYS.STATS) || '{}');
  },
  updateWordStats: (updates: WordStats[]) => {
    const stats = StorageService.getStats();
    updates.forEach((update) => {
      const current = stats[update.wordId] || { wordId: update.wordId, seen: 0, correct: 0, incorrect: 0 };
      current.seen += update.seen;
      current.correct += update.correct;
      current.incorrect += update.incorrect;
      stats[update.wordId] = current;
    });
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },
  
  getHistory: (lessonId: string): QuizSessionResult[] => {
    const history: QuizSessionResult[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
    return history.filter(h => h.lessonId === lessonId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  saveHistory: (result: QuizSessionResult) => {
    const history: QuizSessionResult[] = JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
    history.push(result);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  }
};

export const AuthService = {
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },

  register: async (userData: Omit<User, 'id'>): Promise<User> => {
    await delay(500); // Simulate network
    const users = AuthService.getUsers();
    
    if (users.find(u => u.email === userData.email)) {
      throw new Error("Email already registered");
    }

    const newUser: User = {
      ...userData,
      id: crypto.randomUUID()
    };

    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    AuthService.setCurrentUser(newUser);
    return newUser;
  },

  login: async (email: string, password: string): Promise<User> => {
    await delay(500); // Simulate network
    const users = AuthService.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error("Invalid email or password");
    }
    
    AuthService.setCurrentUser(user);
    return user;
  },

  loginWithGoogle: async (): Promise<User> => {
    await delay(800); // Simulate network popup
    const users = AuthService.getUsers();
    const googleEmail = "demo_user@gmail.com";
    
    // Check if mock google user exists, if not create one
    let user = users.find(u => u.email === googleEmail);
    
    if (!user) {
        user = {
            id: crypto.randomUUID(),
            name: "Demo User",
            email: googleEmail,
        };
        users.push(user);
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
    
    AuthService.setCurrentUser(user);
    return user;
  },

  logout: () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },

  setCurrentUser: (user: User) => {
    // Don't store password in session
    const { password, ...safeUser } = user;
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safeUser));
  }
};