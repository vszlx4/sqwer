# sqwer

A typing tutor and speed test that learns **which finger you actually use for each key**.

Most typing sites only count your speed and mistakes. sqwer also watches how you type, builds a map of the finger you
use for every key, and points you to the habits worth fixing. The course, the practice tests and the competitive
tiers all use that map.

## Features

- **Learning path:** lessons, games and course ranks, starting from the home row.
- **Practice:** timed and word-count tests, your finger map and your history, with XP.
- **Competitive:** speed tiers and leaderboards.
- **Finger map:** a profile of the finger you use for each key and in which contexts, with key-by-key guidance.
- **Works without an account:** without signing in, settings and practice data stay in your browser. An account
  syncs them and enters you on the leaderboards.
- **Privacy first:** one strictly necessary cookie, no third-party resources, and first-party analytics that only
  run after the visitor allows them.

## Tech stack

| Part | Built with |
| --- | --- |
| Site (`apps/web`) | SvelteKit, TypeScript, Node.js 24 |
| Database | PostgreSQL 15+ with Drizzle ORM; an embedded PostgreSQL (PGlite) when none is configured |
| Bot protection | sqwer's own proof-of-work check, with optional Cloudflare Turnstile |
| Shared logic (`packages/*`) | Framework-free TypeScript, tested with Vitest |

## Getting started

You need [Node.js](https://nodejs.org) 24 or later. No database is needed to try it.

```sh
git clone https://github.com/vszlx4/sqwer.git
cd sqwer
npm install
npm run dev            # http://localhost:5173
```

To configure a database or the optional services, copy `apps/web/.env.example` to `apps/web/.env` and fill it in.
Without `DATABASE_URL`, an embedded PostgreSQL is created in `apps/web/.data/`.

### Fonts

The production fonts are not included in this repository. `npm install` puts the open-source
[Roboto Flex](https://github.com/googlefonts/roboto-flex) in their place, so the site builds and runs but looks slightly
different from the live version.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (`apps/web/build`) |
| `npm start` | Serves the production build on http://localhost:3000 |
| `npm test` | Unit tests (engine, layouts, content, finger map) |
| `npm run test:e2e` | Playwright end-to-end tests against the production build |
| `npm run check` | Type check |

## Project structure

| Path | What it is |
| --- | --- |
| `apps/web` | The SvelteKit site |
| `packages/engine` | Typing session, error model and metrics |
| `packages/layouts` | Keyboard geometry, finger assignments and key guidance |
| `packages/content` | Original word lists, lessons and the word generator |
| `packages/fingermap` | Finger profile: observations, context habits, coverage, prompt picker and file format |

## Contributing

Contributions are by invitation. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[branching guide](docs/operations/BRANCHING.md) first. In short: open or pick an issue, branch from `main`, and open a
pull request once `npm run check`, `npm test` and `npm run build` pass.

Found a security problem? Please report it privately, as described in [SECURITY.md](.github/SECURITY.md), and not in a
public issue.

## Licence

The source code is released under the [GNU General Public License v3.0](LICENSE) (GPL-3.0-only).

The licence covers the code only. The **sqwer name and logo**, the production fonts, the illustrations, and the course
and word-list content are not covered by it; see [NOTICE](NOTICE). You may not use them to present another site as
sqwer.
