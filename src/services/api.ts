import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '../config/api';
import { Group, Lesson, Word, QuizSessionResult, QuizSessionFull, WordStats, QuizModeType, StudyStreak } from '../types';

const TOKEN_KEY = 'goimaster_token';
const USER_KEY = 'goimaster_user';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      const user = localStorage.getItem(USER_KEY);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      if (user) {
        try {
          const userData = JSON.parse(user);
          if (userData.id) {
            config.headers['X-User-Id'] = userData.id;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - token invalid or expired
          console.error('Unauthorized. Redirecting to login...');
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          sessionStorage.clear();
          window.location.href = '/#/auth';
        } else if (error.response?.status === 403) {
          // Handle forbidden - user not found or deleted
          console.error('Forbidden - User account does not exist or has been deleted');
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          sessionStorage.clear();
          window.location.href = '/#/auth';
        } else if (error.response?.status === 400) {
          // Log validation errors for debugging
          console.error('Bad Request:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setUser(user: { id: string; email: string; name: string }) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUser(): { id: string; email: string; name: string } | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Groups API
  async getGroups(): Promise<Group[]> {
    const response = await this.client.get<Group[]>('/groups');
    return response.data;
  }

  async createGroup(name: string, description?: string): Promise<Group> {
    const response = await this.client.post<Group>('/groups', { name, description });
    return response.data;
  }

  async getGroup(id: string): Promise<Group> {
    const response = await this.client.get<Group>(`/groups/${id}`);
    return response.data;
  }

  async updateGroup(id: string, name: string, description?: string): Promise<Group> {
    const response = await this.client.put<Group>(`/groups/${id}`, { name, description });
    return response.data;
  }

  async deleteGroup(id: string): Promise<void> {
    await this.client.delete(`/groups/${id}`);
  }

  // Lessons API
  async getLessons(groupId: string): Promise<Lesson[]> {
    const response = await this.client.get<Lesson[]>(`/groups/${groupId}/lessons`);
    return response.data;
  }

  async createLesson(
    groupId: string,
    name: string,
    orderIndex?: number,
    words?: Omit<Word, 'id' | 'lessonId'>[]
  ): Promise<Lesson> {
    const payload: any = {
      name,
      orderIndex: orderIndex ?? 0,
    };

    if (words && words.length > 0) {
      payload.words = words.map((word) => ({
        kanji: word.kanji,
        hanViet: word.hanViet ?? '',
        furigana: word.furigana ?? '',
        meaning: word.meaning,
      }));
    }

    const response = await this.client.post<Lesson>(`/groups/${groupId}/lessons`, payload);
    return response.data;
  }

  async getLesson(id: string): Promise<Lesson> {
    const response = await this.client.get<Lesson>(`/lessons/${id}`);
    return response.data;
  }

  async updateLesson(id: string, name: string, orderIndex?: number): Promise<Lesson> {
    const response = await this.client.put<Lesson>(`/lessons/${id}`, { name, orderIndex });
    return response.data;
  }

  async deleteLesson(id: string): Promise<void> {
    await this.client.delete(`/lessons/${id}`);
  }

  // Words API
  async getWords(lessonId: string): Promise<Word[]> {
    const response = await this.client.get<Word[]>(`/lessons/${lessonId}/words`);
    return response.data;
  }

  async createWords(lessonId: string, words: Omit<Word, 'id' | 'lessonId'>[]): Promise<Word[]> {
    const response = await this.client.post<Word[]>(`/lessons/${lessonId}/words`, {
      words: words.map(w => ({
        kanji: w.kanji,
        hanViet: w.hanViet,
        furigana: w.furigana,
        meaning: w.meaning,
      })),
    });
    return response.data;
  }

  async updateWord(id: string, word: Partial<Word>): Promise<Word> {
    const response = await this.client.put<Word>(`/words/${id}`, {
      kanji: word.kanji,
      hanViet: word.hanViet,
      furigana: word.furigana,
      meaning: word.meaning,
    });
    return response.data;
  }

  async deleteWord(id: string): Promise<void> {
    await this.client.delete(`/words/${id}`);
  }

  // Quiz Sessions API
  async getQuizSessions(lessonId: string): Promise<QuizSessionResult[]> {
    const response = await this.client.get<any[]>(`/lessons/${lessonId}/quiz-sessions`);
    return response.data.map(this.mapQuizSessionToResult);
  }

  async createQuizSession(
    lessonId: string,
    mode: QuizModeType,
    durationSeconds: number,
    totalQuestions: number,
    correctAnswers: number,
    details?: { wordId: string; isCorrect: boolean; kanji?: string; meaning?: string }[]
  ): Promise<QuizSessionResult> {
    const response = await this.client.post<any>(`/lessons/${lessonId}/quiz-sessions`, {
      mode,
      durationSeconds,
      totalQuestions,
      correctAnswers,
      details
    });
    return this.mapQuizSessionToResult(response.data);
  }

  async getQuizSession(id: string): Promise<QuizSessionFull> {
    const response = await this.client.get<any>(`/quiz-sessions/${id}`);
    const result = this.mapQuizSessionToResult(response.data);
    return {
      ...result,
      details: response.data.details.map((d: any) => ({
        id: d.id,
        wordId: d.wordId,
        isCorrect: d.isCorrect,
        kanji: d.kanji,
        meaning: d.meaning
      }))
    };
  }

  // Word Stats API
  async getWordStats(lessonId: string): Promise<Record<string, WordStats>> {
    const response = await this.client.get<WordStats[]>(`/lessons/${lessonId}/word-stats`);
    const stats: Record<string, WordStats> = {};
    response.data.forEach(stat => {
      stats[stat.wordId] = {
        wordId: stat.wordId,
        seen: stat.seen || stat.seenCount || 0,
        correct: stat.correct || stat.correctCount || 0,
        incorrect: stat.incorrect || stat.incorrectCount || 0,
      };
    });
    return stats;
  }

  async batchUpdateWordStats(updates: WordStats[]): Promise<void> {
    await this.client.put('/word-stats/batch', {
      updates: updates.map(update => ({
        wordId: update.wordId,
        seenCount: update.seen,
        correctCount: update.correct,
        incorrectCount: update.incorrect,
      })),
    });
  }

  // Study Streak API
  async getStudyStreak(): Promise<StudyStreak> {
    const response = await this.client.get<StudyStreak>('/study-streak');
    return response.data;
  }

  // Auth API
  async login(email: string, password: string): Promise<{ user: { id: string; email: string; name: string }; token: string }> {
    const response = await this.client.post<{ user: { id: string; email: string; name: string }; token: string }>('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(name: string, email: string, password: string): Promise<{ user: { id: string; email: string; name: string }; token: string }> {
    const response = await this.client.post<{ user: { id: string; email: string; name: string }; token: string }>('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  }

  async verifyUser(): Promise<{ valid: boolean; userId?: string; error?: string; message: string }> {
    try {
      const response = await this.client.get<{ valid: boolean; userId: string; message: string }>('/auth/verify');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        // User not found or authentication failed
        return {
          valid: false,
          error: error.response?.data?.error || 'AUTHENTICATION_FAILED',
          message: error.response?.data?.message || 'Authentication failed'
        };
      }
      throw error;
    }
  }


  // Global Vocabulary (Admin only)
  async getGlobalWords(search?: string): Promise<any[]> {
    const params = search ? { search } : {};
    const response = await this.client.get<any[]>('/global-words', { params });
    return response.data;
  }

  // Personal Vocabulary (User-specific)
  async getPersonalWords(search?: string): Promise<any[]> {
    const params = search ? { search } : {};
    const response = await this.client.get<any[]>('/personal-words', { params });
    return response.data;
  }

  // Helper to map backend QuizSession to frontend QuizSessionResult
  private mapQuizSessionToResult(session: any): QuizSessionResult {
    return {
      id: session.id,
      lessonId: session.lessonId,
      date: session.completedAt || session.startedAt || new Date().toISOString(),
      durationSeconds: session.durationSeconds,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      mode: session.mode as QuizModeType,
    };
  }
}

export const apiService = new ApiService();


