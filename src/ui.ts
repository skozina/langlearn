import type { LanguageData, Lesson, QuizState } from './types';
import type { SummaryData } from './app';
import type { LessonResult } from './storage';

type Screen = 'language-select' | 'lesson-select' | 'quiz' | 'summary' | 'results';

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
  (['language-select', 'lesson-select', 'quiz', 'summary', 'results'] as const).forEach((s) => {
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

// ── Lesson select ────────────────────────────────────────────────────────────

export function renderLessonSelect(
  language: LanguageData,
  getBestResult: (lessonName: string) => LessonResult | undefined,
  onSelect: (lesson: Lesson) => void,
  onBack: () => void,
  onShowResults: () => void
) {
  setScreen('lesson-select');
  setKeyHandler(null);

  el('lesson-lang-name').textContent = `${language.label} (${language.nativeLabel})`;

  const oldBack = el<HTMLButtonElement>('lesson-back-btn');
  const freshBack = oldBack.cloneNode(true) as HTMLButtonElement;
  oldBack.replaceWith(freshBack);
  freshBack.addEventListener('click', onBack);

  const oldList = el('lesson-list');
  const list = document.createElement('div');
  list.id = 'lesson-list';
  oldList.replaceWith(list);

  for (const lesson of language.lessons) {
    const btn = document.createElement('button');
    btn.className = 'lesson-btn';

    const name = document.createElement('span');
    name.className = 'lesson-name';
    name.textContent = lesson.name;
    btn.appendChild(name);

    const best = getBestResult(lesson.name);
    const score = document.createElement('span');
    score.className = 'lesson-best-score';
    score.textContent = best ? `${best.firstTryCorrect} / ${best.total} (${best.scorePercent}%)` : '';
    btn.appendChild(score);

    btn.addEventListener('click', () => onSelect(lesson));
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

  setTimeout(() => buttons()[0]?.focus(), 0);

  const oldResultsLink = el<HTMLButtonElement>('results-link-btn');
  const freshResultsLink = oldResultsLink.cloneNode(true) as HTMLButtonElement;
  oldResultsLink.replaceWith(freshResultsLink);
  freshResultsLink.addEventListener('click', onShowResults);
}

// ── Past results ─────────────────────────────────────────────────────────────

export function renderResults(results: LessonResult[], onBack: () => void) {
  setScreen('results');
  setKeyHandler(null);

  const oldBack = el<HTMLButtonElement>('results-back-btn');
  const freshBack = oldBack.cloneNode(true) as HTMLButtonElement;
  oldBack.replaceWith(freshBack);
  freshBack.addEventListener('click', onBack);

  const list = el('results-list');
  list.innerHTML = '';

  if (results.length === 0) {
    list.innerHTML = '<p class="subtitle">No completed lessons yet.</p>';
    return;
  }

  for (const r of results) {
    const item = document.createElement('div');
    item.className = 'result-item';

    const info = document.createElement('div');
    info.className = 'result-info';
    info.innerHTML = `
      <span class="result-lesson">${r.languageLabel} — ${r.lessonName}</span>
      <span class="result-date">${formatDateTime(r.completedAt)}</span>
    `;

    const score = document.createElement('span');
    score.className = 'result-score';
    score.textContent = `${r.firstTryCorrect} / ${r.total} (${r.scorePercent}%)`;

    item.appendChild(info);
    item.appendChild(score);
    list.appendChild(item);
  }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

const KBD_ROW_1 = 'qwertyuiop';
const KBD_ROW_2 = 'asdfghjkl';
const KBD_ROW_3 = 'zxcvbnm';
const KBD_PUNCTUATION = ["'", '-'];

export function renderQuiz(
  state: QuizState,
  onSubmit: (answer: string) => void
) {
  setScreen('quiz');

  // progress (based on distinct words mastered, not on raw attempts)
  el('progress-text').textContent = `${state.mastered} / ${state.total}`;
  const bar = el<HTMLElement>('progress-bar-fill');
  bar.style.width = `${(state.mastered / state.total) * 100}%`;

  // word prompt
  el('word-native').textContent = state.current.native;
  el('target-lang').textContent = state.language.label;

  // clear input & feedback
  const input = el<HTMLInputElement>('answer-input');
  input.value = '';
  input.className = '';
  hide('feedback');

  // submit handler (replace old one by cloning)
  const form = el<HTMLFormElement>('quiz-form');
  const fresh = form.cloneNode(true) as HTMLFormElement;
  form.replaceWith(fresh);

  const freshInput = fresh.querySelector<HTMLInputElement>('#answer-input')!;
  const checkBtn = fresh.querySelector<HTMLButtonElement>('#check-btn')!;
  checkBtn.type = 'submit';
  checkBtn.textContent = 'Check';
  freshInput.focus();

  function doSubmit() {
    setKeyHandler(null);
    onSubmit(freshInput.value);
  }

  fresh.addEventListener('submit', (e) => {
    e.preventDefault();
    doSubmit();
  });

  function insertChar(text: string) {
    const start = freshInput.selectionStart ?? freshInput.value.length;
    const end = freshInput.selectionEnd ?? freshInput.value.length;
    freshInput.value = freshInput.value.slice(0, start) + text + freshInput.value.slice(end);
    freshInput.selectionStart = freshInput.selectionEnd = start + text.length;
    freshInput.focus();
  }

  function backspace() {
    const start = freshInput.selectionStart ?? freshInput.value.length;
    const end = freshInput.selectionEnd ?? freshInput.value.length;
    if (start === end) {
      if (start === 0) return;
      freshInput.value = freshInput.value.slice(0, start - 1) + freshInput.value.slice(end);
      freshInput.selectionStart = freshInput.selectionEnd = start - 1;
    } else {
      freshInput.value = freshInput.value.slice(0, start) + freshInput.value.slice(end);
      freshInput.selectionStart = freshInput.selectionEnd = start;
    }
    freshInput.focus();
  }

  // custom on-screen keyboard
  const kbd = el('virtual-keyboard');
  kbd.innerHTML = '';

  let shiftOn = false;
  const letterButtons: HTMLButtonElement[] = [];

  function updateLetterLabels() {
    for (const btn of letterButtons) {
      btn.textContent = shiftOn ? btn.dataset.letter!.toUpperCase() : btn.dataset.letter!;
    }
  }

  function makeKey(label: string, className: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = className;
    btn.addEventListener('click', () => {
      btn.classList.add('kbd-key--pressed');
      setTimeout(() => btn.classList.remove('kbd-key--pressed'), 150);
      onClick();
    });
    return btn;
  }

  function addRow(build: (row: HTMLElement) => void, extraClass = '') {
    const row = document.createElement('div');
    row.className = extraClass ? `kbd-row ${extraClass}` : 'kbd-row';
    build(row);
    kbd.appendChild(row);
  }

  function addLetterRow(letters: string) {
    addRow((row) => {
      for (const letter of letters) {
        const btn = makeKey(letter, 'kbd-key', () => {
          insertChar(shiftOn ? letter.toUpperCase() : letter);
          if (shiftOn) {
            shiftOn = false;
            updateLetterLabels();
            shiftBtn.classList.remove('active');
          }
        });
        btn.dataset.letter = letter;
        letterButtons.push(btn);
        row.appendChild(btn);
      }
    });
  }

  if (KBD_PUNCTUATION.length > 0 || state.language.specialChars.length > 0) {
    addRow((row) => {
      for (const char of [...KBD_PUNCTUATION, ...state.language.specialChars]) {
        row.appendChild(makeKey(char, 'kbd-key kbd-key--special', () => insertChar(char)));
      }
    }, 'kbd-row--special');
  }

  addLetterRow(KBD_ROW_1);
  addLetterRow(KBD_ROW_2);

  let shiftBtn!: HTMLButtonElement;
  addRow((row) => {
    shiftBtn = makeKey('⇧', 'kbd-key kbd-key--wide', () => {
      shiftOn = !shiftOn;
      updateLetterLabels();
      shiftBtn.classList.toggle('active', shiftOn);
    });
    row.appendChild(shiftBtn);
    for (const letter of KBD_ROW_3) {
      const btn = makeKey(letter, 'kbd-key', () => {
        insertChar(shiftOn ? letter.toUpperCase() : letter);
        if (shiftOn) {
          shiftOn = false;
          updateLetterLabels();
          shiftBtn.classList.remove('active');
        }
      });
      btn.dataset.letter = letter;
      letterButtons.push(btn);
      row.appendChild(btn);
    }
    row.appendChild(makeKey('⌫', 'kbd-key kbd-key--wide', backspace));
  });

  addRow((row) => {
    row.appendChild(makeKey('␣', 'kbd-key kbd-key--space', () => insertChar(' ')));
  });

  // physical-keyboard fallback (desktop testing convenience)
  setKeyHandler((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSubmit();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
    } else if (e.key.length === 1) {
      e.preventDefault();
      insertChar(e.key);
    }
  });
}

export function renderFeedback(state: QuizState, onNext: () => void) {
  const input = el<HTMLInputElement>('answer-input');
  input.className = state.lastCorrect ? 'correct' : 'wrong';

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

  const btn = el<HTMLButtonElement>('check-btn');
  const fresh = btn.cloneNode(true) as HTMLButtonElement;
  btn.replaceWith(fresh);
  fresh.type = 'button';
  fresh.textContent = 'Next →';

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

  el('summary-lang').textContent = data.languageLabel;
  el('summary-score').textContent = `${data.firstTryCorrect} / ${data.total}`;
  el('summary-accuracy').textContent = `${data.accuracyPercent}% (${data.correctAttempts} / ${data.attempts})`;

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
