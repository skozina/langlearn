import type { LanguageData, Lesson, QuizState, WordPair } from './types';
import { shuffle } from './data';

export function startQuiz(language: LanguageData, lesson: Lesson): QuizState {
  const queue = shuffle(lesson.words);
  return {
    language,
    queue: queue.slice(1),
    current: queue[0],
    score: 0,
    total: lesson.words.length,
    missed: [],
    phase: 'quiz',
    lastCorrect: false,
  };
}

export function submit(state: QuizState, answer: string): QuizState {
  const correct = answer.trim() === state.current.foreign;
  return {
    ...state,
    phase: 'feedback',
    lastCorrect: correct,
    score: correct ? state.score + 1 : state.score,
    missed: correct ? state.missed : [...state.missed, state.current],
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

export function scoreLabel(score: number, total: number): string {
  return `${score} / ${total}`;
}

export interface SummaryData {
  score: number;
  total: number;
  missed: WordPair[];
  languageLabel: string;
}

export function buildSummary(state: QuizState): SummaryData {
  return {
    score: state.score,
    total: state.total,
    missed: state.missed,
    languageLabel: state.language.label,
  };
}
