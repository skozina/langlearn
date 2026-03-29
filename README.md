# LangLearn

A minimal single-page app for practising foreign language vocabulary. Given a word in your mother tongue, type its translation without any typos.

## Requirements

- Node.js 18+
- npm

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Production build

```bash
npm run build
```

The `dist/` folder contains the fully static output. Deploy it to any static host (GitHub Pages, Netlify, Vercel, nginx, etc.) — no server-side runtime required.

To preview the production build locally:

```bash
npm run preview
```

## Adding a new language

1. Create `public/words.xx.json` (replace `xx` with the language code), following the same structure as the existing files:

```json
{
  "id": "xx",
  "label": "Language name in English",
  "nativeLabel": "Language name in its own script",
  "words": [
    { "native": "apple", "foreign": "..." },
    { "native": "house", "foreign": "..." }
  ]
}
```

2. Add `"xx"` to the array in `public/languages.json`.

The new language will appear in the selector immediately — no code changes needed.

## Adding words to an existing language

Edit the `words` array in the relevant `public/words.xx.json` file and add entries with `"native"` and `"foreign"` keys.

## Project structure

```
public/
  languages.json      # ordered list of active language IDs
  words.de.json       # German word pairs
  words.fr.json       # French word pairs
src/
  types.ts            # shared TypeScript interfaces
  data.ts             # data loading and shuffle helper
  app.ts              # pure quiz state machine
  ui.ts               # DOM rendering
  main.ts             # app entry point
  style.css           # mobile-first styles, supports light/dark mode
index.html
```
