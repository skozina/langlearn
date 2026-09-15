export interface LessonResult {
  languageId: string;
  languageLabel: string;
  lessonName: string;
  firstTryCorrect: number;
  total: number;
  scorePercent: number;
  accuracyPercent: number;
  attempts: number;
  correctAttempts: number;
  completedAt: string; // ISO timestamp
}

const STORAGE_KEY = 'langlearn.results';

function readAll(): LessonResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(results: LessonResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded, etc.) — ignore
  }
}

export function saveResult(result: LessonResult) {
  writeAll([...readAll(), result]);
}

export function getAllResults(): LessonResult[] {
  return [...readAll()].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export function getBestResult(languageId: string, lessonName: string): LessonResult | undefined {
  const matches = readAll().filter((r) => r.languageId === languageId && r.lessonName === lessonName);
  if (matches.length === 0) return undefined;
  return matches.reduce((best, r) => (r.scorePercent > best.scorePercent ? r : best));
}
