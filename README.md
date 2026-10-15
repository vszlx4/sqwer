# sqwer

A typing tutor and speed test that learns **which finger you actually use for each key**.

## Run it

```sh
npm install
npm run build          # production build (apps/web/build)
npm start              # serves on http://localhost:3000
npm run dev            # dev server with hot reload
```

Settings are read from `apps/web/.env` (never committed). With `DATABASE_URL` set, accounts are stored in
PostgreSQL (the project uses Supabase in the EU); without it, an embedded PostgreSQL is created in `.data/`, so no
database installation is needed to try the site. See [DEPLOYMENT.md](DEPLOYMENT.md) for configuration and security.

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

## Legal and privacy

The legal documents live in `apps/web/src/routes` (`/legal`, `/terms`, `/privacy`, `/cookies`, `/copyright`,
`/accessibility`, `/security`). Their references, versions and effective dates are kept in one register,
`apps/web/src/lib/site/legal.ts`; change the version there whenever a document changes in substance. The operator's
details are in `apps/web/src/lib/site/links.ts`.

Without an account, settings and practice data are stored only in the visitor's browser. There is one strictly
necessary cookie (the session), no analytics and no third-party resources.

## Third-party assets

- Fonts: PP Altera Serif (titles) and PP Neue Montreal (everything else) by Pangram Pangram Foundry, supplied by the project owner under licence, served as WOFF2 from `apps/web/src/lib/assets/fonts`.
- All illustrations, icons, word lists and copy are original to this project. The MIT licence in `LICENSE` covers the source code only, not the sqwer name and logo, the typefaces, the illustrations or the course materials.
