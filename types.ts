export interface Word {
  id: string;
  lessonId: string;
  kanji: string;
  hanViet: string; // Made required based on user request, but can be empty string
  furigana: string;
  meaning: string;
}

export interface WordStats {
  wordId: string;
  seen: number;
  correct: number;
  incorrect: number;
}

export interface Lesson {
  id: string;
  groupId: string;
  name: string;
  wordCount: number;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
}

export interface QuizSessionResult {
  id: string;
  lessonId: string;
  date: string;
  durationSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  mode: QuizModeType;
}

export enum QuizModeType {
  KANJI_TO_MEANING = 'kanji_meaning',
  FURIGANA_TO_MEANING = 'furigana_meaning',
  KANJI_TO_FURIGANA = 'kanji_furigana',
}

export interface ExcelRow {
  kanji: string;
  hanViet: string;
  furigana: string;
  meaning: string;
  [key: string]: string; 
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Only used for verification, usually not stored in frontend state
}