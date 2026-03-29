import type { LanguageData, QuizState } from './types';
import type { SummaryData } from './app';

type Screen = 'language-select' | 'quiz' | 'summary';

// Only one document-level keydown handler may be active at a time.
let activeKeyHandler: ((e: KeyboardEvent) => void) | null = null;
function setKeyHandler(handler: ((e: KeyboardEvent) => void) | null) {
  if (activeKeyHandler) document.removeEventListener('keydown', activeKeyHandler);
  activeKeyHandler = handler;
  if (handler) document.addEventListener('keydown', handler);
}

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function show(id: string) {
  el(id).hidden = false;
}

function hide(id: string) {
  el(id).hidden = true;
}

function setScreen(screen: Screen) {
  (['language-select', 'quiz', 'summary'] as const).forEach((s) => {
    const elem = el(s);
    elem.hidden = s !== screen;
  });
}

// ── Language select ──────────────────────────────────────────────────────────

export function renderLanguageSelect(
  languages: LanguageData[],
  onSelect: (lang: LanguageData) => void
) {
  setScreen('language-select');
  setKeyHandler(null);

  // Replace the list element to shed any accumulated listeners from previous visits
  const oldList = el('language-list');
  const list = document.createElement('div');
  list.id = 'language-list';
  oldList.replaceWith(list);

  for (const lang of languages) {
    const btn = document.createElement('button');
    btn.textContent = `${lang.label} (${lang.nativeLabel})`;
    btn.addEventListener('click', () => onSelect(lang));
    list.appendChild(btn);
  }

  const buttons = () => Array.from(list.querySelectorAll<HTMLButtonElement>('button'));

  list.addEventListener('keydown', (e) => {
    const btns = buttons();
    const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      btns[(idx + 1) % btns.length].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      btns[(idx - 1 + btns.length) % btns.length].focus();
    }
  });

  // Defer focus so any in-flight Enter keydown (e.g. from advancing the last
  // feedback card) cannot immediately activate the first language button.
  setTimeout(() => buttons()[0]?.focus(), 0);
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

export function renderQuiz(
  state: QuizState,
  onSubmit: (answer: string) => void
) {
  setScreen('quiz');

  // progress
  const done = state.total - state.queue.length - 1; // words answered so far
  el('progress-text').textContent = `${done + 1} / ${state.total}`;
  const bar = el<HTMLElement>('progress-bar-fill');
  bar.style.width = `${((done) / state.total) * 100}%`;

  // word prompt
  el('word-native').textContent = state.current.native;
  el('target-lang').textContent = state.language.label;

  // clear input & feedback
  const input = el<HTMLInputElement>('answer-input');
  input.value = '';
  input.className = '';
  input.readOnly = false;
  hide('feedback');

  // submit handler (replace old one by cloning)
  const form = el<HTMLFormElement>('quiz-form');
  const fresh = form.cloneNode(true) as HTMLFormElement;
  form.replaceWith(fresh);

  const freshInput = fresh.querySelector<HTMLInputElement>('#answer-input')!;
  freshInput.focus();

  fresh.addEventListener('submit', (e) => {
    e.preventDefault();
    onSubmit(freshInput.value);
  });

  // virtual keyboard
  const kbd = el('virtual-keyboard');
  kbd.innerHTML = '';
  for (const char of state.language.specialChars) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = char;
    btn.className = 'kbd-key';
    btn.addEventListener('click', () => {
      const start = freshInput.selectionStart ?? freshInput.value.length;
      const end = freshInput.selectionEnd ?? freshInput.value.length;
      freshInput.value = freshInput.value.slice(0, start) + char + freshInput.value.slice(end);
      freshInput.selectionStart = freshInput.selectionEnd = start + char.length;
      freshInput.focus();
    });
    kbd.appendChild(btn);
  }
}

export function renderFeedback(state: QuizState, onNext: () => void) {
  const input = el<HTMLInputElement>('answer-input');
  input.className = state.lastCorrect ? 'correct' : 'wrong';
  input.readOnly = true;

  el('virtual-keyboard').querySelectorAll<HTMLButtonElement>('.kbd-key').forEach((b) => { b.disabled = true; });

  const fb = el('feedback');
  show('feedback');

  if (state.lastCorrect) {
    fb.className = 'feedback correct';
    fb.textContent = 'Correct!';
  } else {
    fb.className = 'feedback wrong';
    fb.textContent = `Correct answer: ${state.current.foreign}`;
  }

  const btn = el<HTMLButtonElement>('next-btn');
  const fresh = btn.cloneNode(true) as HTMLButtonElement;
  btn.replaceWith(fresh);
  fresh.hidden = false;

  function advance() {
    setKeyHandler(null);
    onNext();
  }
  fresh.addEventListener('click', advance);

  // Keep focus on the input; Enter advances to the next word
  input.focus();
  setKeyHandler((e) => { if (e.key === 'Enter') { e.preventDefault(); advance(); } });
}

// ── Summary ───────────────────────────────────────────────────────────────────

export function renderSummary(data: SummaryData, onRestart: () => void) {
  setScreen('summary');

  el('summary-score').textContent = `${data.score} / ${data.total}`;
  el('summary-lang').textContent = data.languageLabel;

  const missedList = el('missed-list');
  missedList.innerHTML = '';

  if (data.missed.length === 0) {
    missedList.innerHTML = '<li>Perfect score — no mistakes!</li>';
  } else {
    for (const w of data.missed) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="word-native">${w.native}</span> → <span class="word-foreign">${w.foreign}</span>`;
      missedList.appendChild(li);
    }
  }

  const btn = el<HTMLButtonElement>('restart-btn');
  const fresh = btn.cloneNode(true) as HTMLButtonElement;
  btn.replaceWith(fresh);
  function go() {
    setKeyHandler(null);
    onRestart();
  }
  fresh.addEventListener('click', go);
  fresh.focus();
  setKeyHandler((e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
}
