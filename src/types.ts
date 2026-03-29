export interface WordPair {
  native: string;
  foreign: string;
}

export interface Lesson {
  name: string;
  wordCount: number;
}

export interface LanguageData {
  id: string;
  label: string;
  nativeLabel: string;
  specialChars: string[];
  lessons: Lesson[];
  words: WordPair[];
}

export interface QuizState {
  language: LanguageData;
  queue: WordPair[];       // remaining words this round
  current: WordPair;
  score: number;
  total: number;
  missed: WordPair[];
  phase: 'quiz' | 'feedback';
  lastCorrect: boolean;
}
