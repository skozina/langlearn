import './style.css';
import { loadLanguageIds, loadLanguage } from './data';
import { startQuiz, submit, next, isFinished, buildSummary } from './app';
import { renderLanguageSelect, renderLessonSelect, renderQuiz, renderFeedback, renderSummary, renderResults } from './ui';
import { saveResult, getAllResults, getBestResult } from './storage';
import type { LanguageData, QuizState } from './types';

async function init() {
  const ids = await loadLanguageIds();
  const languages: LanguageData[] = await Promise.all(ids.map(loadLanguage));

  function showLanguageSelect() {
    renderLanguageSelect(languages, (lang) => showLessonSelect(lang));
  }

  function showLessonSelect(lang: LanguageData) {
    renderLessonSelect(
      lang,
      (lessonName) => getBestResult(lang.id, lessonName),
      (lesson) => showQuiz(startQuiz(lang, lesson), lang),
      showLanguageSelect,
      () => renderResults(getAllResults(), () => showLessonSelect(lang))
    );
  }

  function finishQuiz(state: QuizState, lang: LanguageData) {
    const summary = buildSummary(state);
    saveResult({
      languageId: summary.languageId,
      languageLabel: summary.languageLabel,
      lessonName: summary.lessonName,
      firstTryCorrect: summary.firstTryCorrect,
      total: summary.total,
      scorePercent: summary.total === 0 ? 0 : Math.round((summary.firstTryCorrect / summary.total) * 100),
      accuracyPercent: summary.accuracyPercent,
      attempts: summary.attempts,
      correctAttempts: summary.correctAttempts,
      completedAt: new Date().toISOString(),
    });
    renderSummary(summary, () => showLessonSelect(lang));
  }

  function showQuiz(state: QuizState, lang: LanguageData) {
    renderQuiz(state, (answer) => {
      const afterSubmit = submit(state, answer);
      renderFeedback(afterSubmit, () => {
        if (isFinished(afterSubmit)) {
          finishQuiz(afterSubmit, lang);
        } else {
          const n = next(afterSubmit);
          if (n === 'summary') {
            finishQuiz(afterSubmit, lang);
          } else {
            showQuiz(n, lang);
          }
        }
      });
    });
  }

  showLanguageSelect();
}

init().catch((err) => {
  document.body.innerHTML = `<p style="color:red;padding:2rem">Failed to load: ${(err as Error).message}</p>`;
});
