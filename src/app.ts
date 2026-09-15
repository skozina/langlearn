import type { LanguageData, Lesson, QuizState, WordPair } from './types';
import { shuffle } from './data';

export function startQuiz(language: LanguageData, lesson: Lesson): QuizState {
  const queue = shuffle(lesson.words);
  return {
    language,
    lessonName: lesson.name,
    queue: queue.slice(1),
    current: queue[0],
    total: lesson.words.length,
    mastered: 0,
    firstTryCorrect: 0,
    attempts: 0,
    correctAttempts: 0,
    missed: [],
    phase: 'quiz',
    lastCorrect: false,
  };
}

export function submit(state: QuizState, answer: string): QuizState {
  const correct = answer.trim() === state.current.foreign;
  const firstAttempt = !state.missed.includes(state.current);

  return {
    ...state,
    phase: 'feedback',
    lastCorrect: correct,
    attempts: state.attempts + 1,
    correctAttempts: correct ? state.correctAttempts + 1 : state.correctAttempts,
    firstTryCorrect: correct && firstAttempt ? state.firstTryCorrect + 1 : state.firstTryCorrect,
    mastered: correct ? state.mastered + 1 : state.mastered,
    missed: !correct && firstAttempt ? [...state.missed, state.current] : state.missed,
    // wrong answers go back to the end of the queue so the word repeats until correct
    queue: correct ? state.queue : [...state.queue, state.current],
  };
}

export function next(state: QuizState): QuizState | 'summary' {
  if (state.queue.length === 0) return 'summary';
  const [current, ...queue] = state.queue;
  return { ...state, phase: 'quiz', current, queue };
}

export function isFinished(state: QuizState): boolean {
  return state.phase === 'feedback' && state.queue.length === 0;
}

export interface SummaryData {
  firstTryCorrect: number;
  total: number;
  attempts: number;
  correctAttempts: number;
  accuracyPercent: number;
  missed: WordPair[];
  languageId: string;
  languageLabel: string;
  lessonName: string;
}

export function buildSummary(state: QuizState): SummaryData {
  return {
    firstTryCorrect: state.firstTryCorrect,
    total: state.total,
    attempts: state.attempts,
    correctAttempts: state.correctAttempts,
    accuracyPercent: state.attempts === 0 ? 0 : Math.round((state.correctAttempts / state.attempts) * 100),
    missed: state.missed,
    languageId: state.language.id,
    languageLabel: state.language.label,
    lessonName: state.lessonName,
  };
}
