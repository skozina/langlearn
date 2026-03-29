import './style.css';
import { loadLanguageIds, loadLanguage } from './data';
import { startQuiz, submit, next, isFinished, buildSummary } from './app';
import { renderLanguageSelect, renderQuiz, renderFeedback, renderSummary } from './ui';
import type { LanguageData, QuizState } from './types';

async function init() {
  const ids = await loadLanguageIds();
  const languages: LanguageData[] = await Promise.all(ids.map(loadLanguage));

  function showLanguageSelect() {
    renderLanguageSelect(languages, (lang) => {
      showQuiz(startQuiz(lang));
    });
  }

  function showQuiz(state: QuizState) {
    renderQuiz(state, (answer) => {
      const afterSubmit = submit(state, answer);
      renderFeedback(afterSubmit, () => {
        if (isFinished(afterSubmit)) {
          renderSummary(buildSummary(afterSubmit), showLanguageSelect);
        } else {
          const n = next(afterSubmit);
          if (n === 'summary') {
            renderSummary(buildSummary(afterSubmit), showLanguageSelect);
          } else {
            showQuiz(n);
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
