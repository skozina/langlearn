import type { LanguageData } from './types';

export async function loadLanguageIds(): Promise<string[]> {
  const res = await fetch('./languages.json');
  if (!res.ok) throw new Error('Could not load languages.json');
  return res.json();
}

export async function loadLanguage(id: string): Promise<LanguageData> {
  const res = await fetch(`./words.${id}.json`);
  if (!res.ok) throw new Error(`Could not load words.${id}.json`);
  return res.json();
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
