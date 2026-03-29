import './style.css';
import { loadLanguageIds, loadLanguage } from './data';
import { startQuiz, submit, next, isFinished, buildSummary } from './app';
import { renderLanguageSelect, renderLessonSelect, renderQuiz, renderFeedback, renderSummary } from './ui';
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
      (lesson) => showQuiz(startQuiz(lang, lesson), lang),
      showLanguageSelect
    );
  }

  function showQuiz(state: QuizState, lang: LanguageData) {
    renderQuiz(state, (answer) => {
      const afterSubmit = submit(state, answer);
      renderFeedback(afterSubmit, () => {
        if (isFinished(afterSubmit)) {
          renderSummary(buildSummary(afterSubmit), () => showLessonSelect(lang));
        } else {
          const n = next(afterSubmit);
          if (n === 'summary') {
            renderSummary(buildSummary(afterSubmit), () => showLessonSelect(lang));
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
