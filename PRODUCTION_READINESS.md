# Production readiness and final security report, October 2026

**Verdict: conditionally ready.** The application code is in a deployable state: the security controls below are
implemented and were verified by tests against a production build. Production readiness depends on infrastructure and
operational steps that cannot be verified from this repository (HTTPS proxy, database role and network restrictions,
secrets, processor agreements, backups, monitoring). They are listed under "Before launch" and must be completed and
checked in the production environment.

## Scope and method

Whole application: SvelteKit server and client, all routes and APIs, authentication and sessions, bot protection,
analytics and administration, database schema, migrations and access, scripts, dependencies, configuration and the
documented deployment. Earlier work (account redesign, bot protection, analytics, the vulnerability audit in
`SECURITY_AUDIT.md`) was re-inspected rather than assumed correct.

Methods: code review of every server entry point; dependency audit; secret scans of the client bundle, static files
and git history; tests against a real PostgreSQL engine (PGlite) including a restricted role; non-destructive probes of
a local production build (headers, CORS, CSRF, error disclosure, path traversal, configuration warnings, health check);
the full unit and end-to-end suites; and three reviews of the final change (`/security-review`, `/code-review`,
`/privacy-compliance`). No production system, real account or the production database was touched, and no load or
destructive tests were run.

## Findings in this review

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | High (defence in depth) | **Least privilege was unusable.** Every table has row-level security without policies, and start-up ran DDL. A restricted application role therefore saw no rows and could not start, so the only working setup was connecting as the table owner: a compromised app could drop or alter any table. | Fixed: read-only migration check, `DATABASE_MIGRATIONS=manual`, `npm run db:migrate` with an owner URL and `DATABASE_APP_ROLE` (one policy per table; migration ledger read-only). Tested against PostgreSQL: the role reads and writes rows, cannot change the schema or the ledger, and Supabase-style API roles still see nothing. |
| 2 | Medium | **Turnstile test secrets on a public site** pass every token, silently switching verification off. | Fixed: refused on public sites (self-hosted check used), warned at start-up. Unit test. |
| 3 | Medium | **No per-user indexes** on `results`, `sessions`, `security_events`, `recovery_codes`, `xp_grants`: every signed-in page scanned whole tables, worsening with growth. | Fixed: migration `0013_indexes.sql`. |
| 4 | Medium | **No database timeouts**: a slow query or stuck transaction could hold the 5-connection pool. | Fixed: 10 s connect, 15 s statement, 30 s idle-in-transaction; pool errors logged. |
| 5 | Medium | **Sessions could be renewed indefinitely**: a copied cookie stayed valid while used. | Fixed: 90-day absolute lifetime, also applied to the device list and purge. Unit tests. Policies updated. |
| 6 | Medium | **Public leaderboard recomputed for every anonymous visit** (a pass over all listed players). | Fixed: 30-second cache, cleared on any change to listings (opt-out, deletion, new verified result). |
| 7 | Low | Data downloads and analytics exports unlimited and unrecorded; admin access denials unrecorded. | Fixed: rate limits; `data_exported` (shown to the user), `admin_export`, `admin_denied` events. |
| 8 | Low | Analytics ingestion limited only per address. | Fixed: per-network and site-wide caps on valid batches; analytics gives way under a flood, the site does not. |
| 9 | Low | Common passwords (`1234567890`, `password123`) accepted. | Fixed: blocklist and repeated/sequential checks (NIST SP 800-63B 5.1.1.2). Unit tests. |
| 10 | Low | Unexpected errors had no reference for support; no health check; unsafe settings went unnoticed. | Fixed: error references (details only in logs), `/healthz`, start-up configuration warnings, proxy-header warning, database failure reason logged once. |
| 11 | Low | No CI or dependency automation. | Fixed: GitHub Actions (audit, type check, unit tests, build; read-only permissions) and Dependabot. |
| 12 | Info | Missing isolation headers. | Added COOP and CORP `same-origin`, `X-Permitted-Cross-Domain-Policies: none`. |

Issues found by the reviews of this change and fixed before commit: `db:migrate` read `MIGRATION_DATABASE_URL` before
loading `.env`; cache entries could outlive an opt-out; a failed cache computation could evict a newer one; invalid
analytics requests counted towards the site-wide cap; the application role could write the migration ledger; the
configuration check did not trim values; a blank `DATABASE_URL` was handled inconsistently by the scripts. The
security review found no exploitable vulnerability in the change.

## Re-verified from earlier work

Open redirect after sign-in, captcha answer readable from markup, lock-out and timing account enumeration, session
hygiene (`SECURITY_AUDIT.md`): fixes present and covered by passing regression tests. Bot protection (server-side
verification, signed single-use tickets and challenges, Turnstile hostname/action/replay checks, direct-request
refusal): end-to-end abuse tests pass. Analytics consent (nothing before Allow, GPC honoured) and administrator access
(404/401/403): end-to-end tests pass. Row-level security on all 18 tables (17 application tables and the migration
ledger).

## Security posture (verified)

- **Input and output:** all SQL parameterised (Drizzle builder and `sql` tag; `sql.raw` only for bundled migrations);
  no shell, `eval` or file paths from requests; Svelte escaping, three `{@html}` uses with server-generated content
  only; strict nonce-based CSP; profile pictures checked by content, served sandboxed with `nosniff`.
- **Authentication:** scrypt (N=16384) with constant-time comparison and a dummy hash for unknown accounts; 256-bit
  session tokens stored as SHA-256; `HttpOnly`, `SameSite=Lax`, `Secure` with an HTTPS `PUBLIC_SITE_URL`; sessions end
  on password change and reset; re-authentication for password change, recovery codes, clearing data and deletion;
  recovery codes single-use and hashed; lock-out with identical answers for any address.
- **Access control:** every account and API route is scoped to the session's user; administrator role read from the
  database on every request; roles changeable only from the server's command line.
- **CSRF and CORS:** origin checks against the configured origin (not the Host header); JSON-only same-origin API
  writes; no CORS headers; `OPTIONS` refused.
- **Headers:** CSP, HSTS (over HTTPS), `X-Frame-Options: DENY` and `frame-ancestors 'none'`, `nosniff`, referrer and
  permissions policies, COOP, CORP.
- **Disclosure:** generic errors with a reference; no client source maps; no secrets in the bundle, static files or git
  history; IP addresses only as keyed hashes in logs; no passwords, tokens or cookies logged.

## Tests and scans (actual results)

| Check | Result |
| --- | --- |
| Type check (`npm run check -w web`) | 0 errors, 0 warnings |
| Unit tests (`npx vitest run`) | 154 passed |
| End-to-end, production build (`npx playwright test`) | 74 passed (registration, sign-in, sign-out, reset, lock-out, captcha and bot abuse, redirects, profile, data export and deletion, analytics consent, admin access, accessibility checks) |
| Production build | Succeeds; no client source maps |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm audit` (all) | 4 moderate, all GHSA-67mh-4wv8-2f99 in esbuild under `drizzle-kit` (development tool, dev-server advisory not applicable; fix would downgrade drizzle-kit) |
| Secret scan (bundle, static, git history) | Nothing found |
| Live probes (local production build) | Headers present; cross-site API and form posts 403; `OPTIONS` 405; traversal attempts 404; `/healthz` 200, 503 on an outdated schema in manual mode with the reason logged; configuration and proxy warnings logged without values |
| Restricted database role (PostgreSQL, unit test) | Reads and writes rows; cannot create tables or alter the migration ledger; API-style role sees nothing |

Not run: CI on GitHub (runs on the next push), tests against the production database or hosting, TLS checks, load tests.

## Residual risks (accepted, with reasons)

| Risk | Why accepted | Mitigation or later action |
| --- | --- | --- |
| No multi-factor authentication | Not implemented and not claimed anywhere. Accounts hold typing data; administrators see only aggregated analytics without emails or ids | Add TOTP, at least for administrators (later list) |
| In-memory rate limits (per process) | One process is the supported deployment | Shared store (Redis) if scaled out |
| Practice results and their XP come from the browser | Affects fairness of levels only; ranked results are checked against keystroke timings | Server-side plausibility for practice XP if abuse appears |
| Text verification questions can be answered by programs | Required for accessibility; other layers do not depend on them | Enable Turnstile in production |
| `style-src 'unsafe-inline'` | Svelte inline styles | Revisit when the framework supports style nonces |
| Volumetric DDoS | Cannot be solved in application code | CDN/WAF in front (below) |
| Backups contain personal data unencrypted on the backup machine | Script restricts permissions (700/600) | Store on an encrypted disk and off-site copy |

## Before launch (required)

1. **HTTPS reverse proxy** in front of the Node server, HTTP redirected, port firewalled; `ADDRESS_HEADER`/`XFF_DEPTH`
   matching the proxy. Preferably a CDN/WAF with DDoS protection (for example Cloudflare proxy with
   `ADDRESS_HEADER=cf-connecting-ip`) and edge rate limits on `/signin`, `/signup`, `/reset-password`, `/api/`.
2. **Secrets** in the server environment: `PUBLIC_SITE_URL` (HTTPS), `CAPTCHA_HMAC_SECRET`, `CAPTCHA_HMAC_KEY_SECRET`,
   `LOG_HASH_SECRET` (32 random bytes each); real Turnstile keys for the production hostname.
3. **Database:** create the `sqwer_app` role; run `npm run db:migrate -w web` with `MIGRATION_DATABASE_URL` (owner) and
   `DATABASE_APP_ROLE=sqwer_app`; run the app with `DATABASE_URL` for `sqwer_app` and `DATABASE_MIGRATIONS=manual`;
   restrict database network access; keep SSL enforced and `DATABASE_CA_FILE` set.
4. **Start-up check:** the server log must show no `"kind":"config"` warnings; `/healthz` must return 200.
5. **Privacy:** name the web host (`LEGAL.webHost` in `apps/web/src/lib/site/links.ts`); accept the processor agreements
   of Supabase, the web host and (if used) Cloudflare; have counsel confirm the open points in `PRIVACY_RECORDS.md`
   (EU/UK representative, UK fee, Saudi PDPL).
6. **Backups:** schedule `npm run db:backup -w web` daily on an encrypted disk, copy off-site, and test one restore.
7. **Monitoring:** keep logs 14 days with restricted access; alert on bursts of failed sign-ins, lock-outs, captcha
   failures, `admin_denied` and `"kind":"error"`; uptime check on `/healthz`.
8. **Administrator:** `npm run admin -w web -- grant <your email>`; sign in once and confirm the `Secure` cookie and
   HSTS header in the browser.

The full procedures are in `DEPLOYMENT.md` (production checklist and incident response).

## Later (recommended)

- TOTP multi-factor authentication, required for administrators.
- Shared rate-limit store if more than one process is run.
- Pin GitHub Actions to commit SHAs; review Dependabot updates (SvelteKit 3.1.0, PGlite 0.5.10 pending, none
  security-related).
- Optional `__Host-` session cookie prefix (requires a planned sign-out of all users).
- Breached-password check (k-anonymity range query) in addition to the local blocklist.
- Annual review of this report, `PRIVACY_RECORDS.md` and the legal documents.

## Changes in this review

New settings: `DATABASE_MIGRATIONS`, `MIGRATION_DATABASE_URL`, `DATABASE_APP_ROLE`, `DATABASE_STATEMENT_TIMEOUT_MS`
(and the existing `DATABASE_POOL_SIZE`, now documented). New migration: `0013_indexes.sql` (indexes only). New
commands: `npm run db:migrate -w web`, `npm run admin -w web -- signout <email> | signout-everyone`. New endpoint:
`GET /healthz`. New files: `.github/workflows/ci.yml`, `.github/dependabot.yml`, `PRIVACY_RECORDS.md`, this report.
Documents updated: `DEPLOYMENT.md`, Privacy Policy 2.4, Cookie and Storage Policy 2.3. No dependency versions changed.

## Follow-up hardening (application and database level)

| Item | What changed |
| --- | --- |
| Database role (C2) | Every request runs as the restricted `sqwer_app` role by default: migrations use a separate owner connection, the role is created and granted row access automatically, request connections switch to it through pg-pool's `onConnect` (fail closed), and start-up refuses the database if requests would not run as the role. Verified on the embedded database (unit tests) and over the PostgreSQL wire protocol (role created without login, superuser or RLS bypass; 18 policies; a missing role gives 503 and a logged reason). Full separation still needs `sqwer_app` as its own login in `DATABASE_URL`. |
| Administrator 2FA (D1) | TOTP (RFC 6238, verified against the RFC test vectors) required for every administrator page and the export: set-up after the password, QR code or key, secrets encrypted with AES-256-GCM (`TOTP_ENCRYPTION_SECRET`), one step of drift, every code usable once (atomic), 5 attempts per 15 minutes, per-session confirmation valid 12 hours, recovery with `reset-2fa`. |
| Suspension (D4) | `users.suspended_at` and reason (migration 0014). Suspended accounts lose every session at once, cannot sign in (told only after the right password) or reset their password, and disappear from leaderboards, public profiles and pictures. Admin dashboard **Users** page and `suspend`/`unsuspend` commands; administrators only from the server. |
| Anti-cheat (D3) | The server replays every result's keystrokes with the typing engine. Refused: future timestamps, out-of-order or miscounted keystrokes, keystrokes after the end, figures the keystrokes do not produce, sustained speed or one-second bursts beyond human limits. Not rated (stored, no XP, no rank): no keystroke record, machine-regular timing, overlap with another rated result, more than an hour of typing per hour. XP uses recomputed figures and active typing time. Lessons: stars limited by accuracy, at most one completion per 30 seconds and 40 per hour. |
| Body limits (D11) | 64 KB by default (forms, sign-in, most APIs), 32 KB analytics, 1 MB results and statistics, 1.5 MB profile pictures, 6 MB finger map only; chunked bodies without a length refused. |
| Session cookie (D14) | `__Host-sqwer_session` on HTTPS sites (Secure, Path=/, no Domain); plain `sqwer_session` on HTTP development, where browsers refuse the prefix. |
| Analytics (D12) | Events need a signed token issued with a page load (bound to the browser, 24 hours, issuance limited per address and network); limits per token and per visit; network and site-wide limits count only batches that passed everything else. |

Tests after these changes: type check clean; 174 unit tests and 83 end-to-end tests pass.

