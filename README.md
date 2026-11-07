# Lexicon

Lexicon is a local-first tech vocabulary trainer. It turns the language of software engineering into precise, studyable entries: **term → category → definition → purpose → key point or example**.

The app is a fully static site. All progress stays in the browser, so it can be hosted for free on GitHub Pages with no server, account, or database.

## What's inside

- **366 terms** across 19 fields, including engineering foundations, algorithms, hashing, operating systems, Go concurrency, networking, HTTP and backend, databases, distributed systems, caching, architecture, patterns, reliability, security, Git, testing, web architecture, cloud, and DevOps.
- **Tier 1 / 2 / 3 prioritization** for terms where a priority was supplied. Tier 1 is the non-negotiable core, Tier 2 is the working vocabulary of production systems, and Tier 3 covers deeper precision.
- **Library** with full-text search, category filters, tier filters, bookmarks, and study status.
- **Term pages** with definitions, purpose, key points, examples, aliases, related terms, notes, and per-term review history.
- **Flashcards** with an SM-2-inspired scheduler: Again, Hard, Good, and Easy ratings, keyboard controls, session progress, and automatic resume after a refresh.
- **Quizzes** with mixed question formats, configurable field and tier scope, scoring, a review of every answer, and retry of missed terms.
- **Distinctions** for commonly confused concept pairs, with deep links such as `#/distinctions#hashing-encryption-encoding`.
- **Progress dashboard** with an activity heatmap, daily goal, seven-day review chart, category and tier completion, quiz history, and trouble spots.
- **Settings** with name, daily goal, session size, hints, data usage, JSON export/import, and separate learning-data or full-data resets.
- **Local-first persistence** through `localStorage`, with cross-tab synchronization and a portable backup format.

## Design

The site palette is deliberately fixed:

| Role | Color | Share |
| --- | --- | --- |
| Primary | Ocean Blue `#1D4ED8` | 60% |
| Secondary | Sage Green `#86EFAC` | 30% |
| Accent | Soft Amber `#F59E0B` | 10% |

Flashcards use their own study palette:

| Role | Color | Share |
| --- | --- | --- |
| Card surface | Pale Butter Yellow `#FEF08A` | 60% |
| Supporting surfaces | Slate / Sky `#F0F9FF` and `#E2E8F0` | 30% |
| Trouble spots | Coral / Red `#EF4444` | 10% |

Coral is reserved for consistently missed definitions and missed summaries. Site-level destructive actions use deep amber rather than red so the signal stays meaningful.

## Tech stack

- Vite 8
- React 19
- TypeScript
- React Router 7 with `HashRouter`
- CSS split into tokens, base, layout, components, and page layers
- `lucide-react` icons
- Manrope, Instrument Serif, and JetBrains Mono via Fontsource
- `localStorage` only, no backend

## Local development

Requires Node 22.12 or newer.

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

### Scripts

```bash
npm run dev      # Development server with hot reload
npm run build    # Type-check and build the static site into dist/
npm run preview  # Serve the production build locally
npm run lint     # Run oxlint
```

## Project structure

```text
src/
  components/       Shared UI, layout, term, quiz, and progress components
  context/          Study state and toast providers
  data/
    categories.ts   Category metadata and tier descriptions
    distinctions.ts Confusable-pair content
    catalog.ts      Term registry, lookups, and derived indexes
    terms/          One authored file per category
  lib/              Storage, SRS, stats, search, queues, and quiz generation
  pages/            Route-level pages
  styles/           Layered global styles and page styles
  types.ts          Domain types and category IDs
```

## Authoring content

Terms live in `src/data/terms/`, one file per category. Each file calls `defineTerms(categoryId, [...])`:

```ts
import { defineTerms } from './define'

export const exampleTerms = defineTerms('foundations', [
  {
    term: 'Idempotence',
    tier: 2,
    definition: 'The property that repeating an operation produces the same observable result as performing it once.',
    purpose: 'Make retries and duplicate delivery safe.',
    keyPoint: 'Idempotent does not mean side-effect free; it means repeated effects are equivalent.',
    example: 'Setting a user’s email to a value is idempotent; appending to a log is not.',
    aliases: ['Idempotent'],
    alsoIn: ['distributed-systems', 'http-backend'],
  },
])
```

How IDs work:

- Term IDs are stable slugs generated from the term name, so progress, notes, and bookmarks never split across duplicates.
- Renaming a term changes its URL and ID. Prefer adding an alias instead.
- Duplicate IDs are checked automatically in development.

To add a term:

1. Add it to the matching file in `src/data/terms/`.
2. Use `tier` only when the term belongs to the supplied priority list.
3. Use `purpose`, `keyPoint`, and `example` where they add real understanding rather than filler.
4. Run `npm run build`; Vite reports TypeScript and content-shape errors.

To add a category, update `CATEGORY_IDS` in `src/types.ts`, add metadata in `src/data/categories.ts`, create a term file, and register it in `src/data/catalog.ts`. Category artwork is selected through the `icon` field.

## Local data and backups

Everything is namespaced under `lexicon.v1.*`:

| Key | Contents |
| --- | --- |
| `lexicon.v1.progress` | Per-term status, reviews, due date, ease, and accuracy |
| `lexicon.v1.bookmarks` | Saved term IDs |
| `lexicon.v1.notes` | Personal notes keyed by term ID |
| `lexicon.v1.activity` | Daily review, quiz, and learning counts |
| `lexicon.v1.quizHistory` | Completed quiz results |
| `lexicon.v1.prefs` | Name, daily goal, session size, and hint preferences |
| `lexicon.v1.flashcardSession` | In-progress flashcard session, intentionally resumable |

Progress, bookmarks, notes, activity, quiz history, preferences, and an in-progress flashcard session survive refreshes. Open tabs stay in sync through the `storage` event.

Settings exports a JSON bundle:

```json
{
  "app": "lexicon",
  "version": 1,
  "exportedAt": 1794068000000,
  "data": {
    "lexicon.v1.progress": {},
    "lexicon.v1.bookmarks": [],
    "lexicon.v1.notes": {},
    "lexicon.v1.activity": {},
    "lexicon.v1.quizHistory": [],
    "lexicon.v1.prefs": {}
  }
}
```

`exportedAt` is a Unix timestamp in milliseconds. Import validates the app marker and version, then replaces matching stores and reloads the page. Back up before importing. Clearing browsing data, using private mode, or changing browser storage settings can erase progress.

## Deploying to GitHub Pages

The repository includes `.github/workflows/deploy.yml`. On every push to `main` it installs dependencies, builds, uploads `dist/`, and deploys to GitHub Pages.

1. Create a GitHub repository and push this project to the `main` branch.

   ```bash
   git init
   git add .
   git commit -m "Build Lexicon vocabulary trainer"
   git branch -M main
   git remote add origin https://github.com/<your-user>/<your-repo>.git
   git push -u origin main
   ```

2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Wait for the **Deploy to GitHub Pages** workflow to finish. The site URL appears on the Pages settings page and in the deployment job.

Why this setup works on project sites:

- `vite.config.ts` uses `base: './'`, so assets resolve relative to wherever the site is served.
- `HashRouter` keeps all routes inside the URL fragment. GitHub Pages needs no SPA rewrite or 404 fallback.
- `public/.nojekyll` prevents Jekyll from ignoring build files.
- No environment variables or secrets are required.

## Notes for contributors

- Keep the palette ratios and the coral reservation intact.
- Prefer precise definitions over encyclopedic length.
- Preserve stable term IDs.
- Treat localStorage as the only source of user state; there is no server-side backup.
- Run `npm run build` and `npm run lint` before publishing.
