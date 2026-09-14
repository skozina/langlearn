export interface WordPair {
  native: string;
  foreign: string;
}

export interface Lesson {
  name: string;
  words: WordPair[];
}

export interface LanguageData {
  id: string;
  label: string;
  nativeLabel: string;
  specialChars: string[];
  lessons: Lesson[];
}

export interface QuizState {
  language: LanguageData;
  queue: WordPair[];       // words not yet answered correctly (wrong answers are requeued at the end)
  current: WordPair;
  total: number;           // distinct words in the lesson
  mastered: number;        // distinct words answered correctly so far
  firstTryCorrect: number; // distinct words answered correctly on their very first attempt
  attempts: number;        // total answers submitted this round, including retries
  correctAttempts: number; // total correct answers submitted this round, including retries
  missed: WordPair[];      // words that were ever answered wrong (for the review list)
  phase: 'quiz' | 'feedback';
  lastCorrect: boolean;
}
