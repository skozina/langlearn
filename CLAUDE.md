# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server at http://localhost:5173 with HMR
npm run build     # TypeScript type-check + production bundle → dist/
npm run preview   # Serve the production build locally
```

There is no test runner or linter configured. TypeScript strict mode (`tsc`) is the primary code correctness tool and runs as part of `build`.

## Architecture

**LangLearn** is a static SPA for vocabulary practice. No backend, no framework — just TypeScript, Vite, and DOM APIs.

### Module responsibilities

| File | Role |
|------|------|
| `src/main.ts` | Bootstrap and screen navigation state machine |
| `src/app.ts` | Quiz logic — pure functions, immutable state transitions |
| `src/data.ts` | Async JSON loading and Fisher-Yates shuffle |
| `src/ui.ts` | Stateless render functions + event wiring; manages a single active keyboard handler |
| `src/types.ts` | All shared TypeScript interfaces |

### Navigation flow

```
Language Select → Lesson Select → Quiz → Feedback (per answer) → Summary → Lesson Select
```

`main.ts` owns this flow by calling `ui.ts` render functions and passing callbacks. `app.ts` never touches the DOM.

### Adding a language

1. Create `public/words.xx.json` following the schema in `src/types.ts` (`LanguageData`).
2. Add the language ID to `public/languages.json`.

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on every push to `main`. Vite is configured with a relative base (`./`) to support subdirectory hosting.
