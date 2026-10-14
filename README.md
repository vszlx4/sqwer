# sqwer

A typing tutor and speed test that learns **which finger you actually use for each key**.

## Run it

```sh
npm install
npm run build          # production build (apps/web/build)
npm start              # serves on http://localhost:3000
npm run dev            # dev server with hot reload
```

Accounts use an embedded PostgreSQL in `.data/` when `DATABASE_URL` is not set, so no database installation is
needed locally. See [DEPLOYMENT.md](DEPLOYMENT.md) for production configuration and security notes.

## Test

```sh
npm test               # unit tests (engine, layouts, content)
npm run test:e2e       # Playwright end-to-end tests against the production build
npm run check          # type check
```

## Layout

| Path | What it is |
| --- | --- |
| `apps/web` | SvelteKit site |
| `packages/engine` | Typing session, error model and metrics (framework-free) |
| `packages/layouts` | Keyboard geometry, finger assignments and key guidance |
| `packages/content` | Original word lists and the word generator |
| `packages/fingermap` | Finger profile: observations, context habits, coverage, prompt picker, file format |

## Privacy

Without an account, settings and the finger map are stored only in the visitor's browser. With an account, the
finger map is also stored in the database. There is one strictly necessary cookie (the session) and no analytics.

## Third-party assets

- Fonts: PP Altera Serif (titles) and PP Neue Montreal (everything else) by Pangram Pangram, supplied by the project owner. Source `.otf` files live in `apps/web/src/lib/assets/fonts/otf`; the site serves the WOFF2 versions next to them. Check the font licence covers web use before deploying.
- All illustrations, icons, word lists and copy are original to this project.
