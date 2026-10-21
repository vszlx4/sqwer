# Security audit, October 2026

Scope: the application code in this repository (SvelteKit server and client, database schema and access, API
endpoints, authentication, sessions, bot protection, uploads, analytics and administration), its configuration and
its dependencies. Infrastructure, hosting and the production database were not tested; a separate production-readiness
review will cover deployment and defence in depth.

Method: code review of every server route, form action, API endpoint and server module; a dependency audit; a scan of
the client bundle, static files and git history for secrets; and non-destructive tests against a local production
build with synthetic accounts (headers, CORS, CSRF, error disclosure, path traversal, redirects, lock-out behaviour).
No production system or real account was touched.

## Confirmed vulnerabilities (fixed)

| # | Severity | Component | Finding | Fix | Regression test |
| --- | --- | --- | --- | --- | --- |
| 1 | Medium | `src/lib/server/validation.ts` (`safeRedirect`), used by `/signin` | **Open redirect.** The check rejected `//` and `/\`, but browsers remove tab and newline characters from URLs, so `redirectTo=/%09/evil.example` passed as a path and sent the visitor to `evil.example` after signing in (confirmed with the WHATWG URL parser; tabs are allowed in a `Location` header). Usable for post-login phishing. | Targets containing control characters or backslashes are refused; the target is resolved as a browser would and must stay on the site; the normalised path is returned. | Unit (`security.test.ts`) and end to end (`bot.spec.ts`: redirect never leaves the site) |
| 2 | Medium | `src/lib/server/captcha.ts` (`drawCharacters`) | **Verification bypass without image recognition.** Each character of the image challenge was emitted as its fixed glyph path, with the distortion only in a `transform` attribute, in reading order. A script could read the answer from the SVG markup by matching path strings. The other layers (tickets, risk scoring, rate limits, single use) still applied. | The distortion (scale, slant, rotation, position) and random jitter are applied to every point, written as new absolute coordinates; elements are shuffled. Legibility checked visually. | Unit: no glyph path or transform in the markup, no two drawings alike |
| 3 | Low to medium | `src/routes/signin/+page.server.ts` | **Account enumeration through the lock-out.** A registered account was locked after ten failures and answered "Too many attempts", while an unregistered address kept answering "incorrect" (the all-address limit for it was 30). Ten attempts from two addresses revealed whether an address was registered. | One count per email address, kept for every address entered, decides the lock (10 failures from all addresses in 15 minutes) and gives the same message; the database lock for real accounts uses the same count. | End to end (`bot.spec.ts`: same answer for a real and an unknown address) |
| 4 | Low | `src/routes/signup/+page.server.ts` | **Account enumeration through response time.** For a registered address the form answered before hashing the password; for a new one it hashed first (about 50 ms longer). | The password is hashed before the address is looked up. A simultaneous duplicate registration now gets the same general message instead of an internal error. | Covered by the existing sign-up tests (behaviour unchanged) |
| 5 | Low | Sign-in, sign-up and password reset actions | **Earlier session not ended.** A browser that was already signed in and posted to these forms kept its previous session valid alongside the new one. | Any existing session of the browser is deleted before the new one is created. | Existing account tests |

Sign-in also refuses passwords longer than 1,024 characters without hashing them (the site accepts at most 128).

## Verified as sound (no change needed)

- **Injection:** every database query uses Drizzle's query builder or its `sql` tag with bound parameters; the only
  `sql.raw` runs the bundled migration files. No shell commands, `eval` or dynamic code. File paths never come from
  requests.
- **XSS:** Svelte escapes all output. The three `{@html}` uses are server-generated: the captcha SVG (no user input)
  and JSON-LD with `<` escaped. User data never reaches `href` or `src` without validation. Strict nonce-based CSP.
- **Uploads:** profile pictures are accepted by their actual bytes (PNG, JPEG, WebP), at most 1 MB, stored in the
  database, and served with the detected type, `nosniff`, `Content-Security-Policy: default-src 'none'; sandbox`, and
  only to the owner or when the profile is public or listed.
- **Access control:** every account and API route takes the user from the session and scopes queries to that user;
  session revocation checks ownership; administrator pages, loads and the export check the role from the database on
  every request (404, 401 or 403). No route lets a user change their role.
- **Sessions:** 256-bit random tokens, only SHA-256 hashes stored; `HttpOnly`, `SameSite=Lax`, and `Secure` with an
  HTTPS `PUBLIC_SITE_URL` (adapter-node assumes HTTPS unless told otherwise); all sessions ended on password change and
  reset; scrypt password hashing with constant-time comparison and a dummy hash for unknown accounts.
- **CSRF and CORS:** form posts are checked by SvelteKit against the configured origin (not the Host header); API
  writes require the same origin and JSON; no CORS headers are ever sent; `OPTIONS` is refused.
- **Headers:** CSP, `X-Frame-Options: DENY` and `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS over HTTPS, `no-store` on signed-in pages.
- **Information disclosure:** unexpected errors return a generic message; no client source maps; no secrets in the
  client bundle, static files or git history; `.env` and certificates are ignored; security logs hash IP addresses.
- **Database:** row-level security is enabled on all 17 tables (no policies), so Supabase's public API roles cannot read
  them; DEPLOYMENT.md describes a restricted application role.
- **Rate limits** on sign-up, sign-in, reset, the challenge endpoint, password checks and every write API.

## Dependencies

`npm audit --omit=dev`: no known vulnerabilities in production dependencies. `npm audit` reports four moderate
advisories, all GHSA-67mh-4wv8-2f99 in an old `esbuild` used by `@esbuild-kit/*` under `drizzle-kit`, the development
tool that generates migrations. The advisory concerns esbuild's development server, which drizzle-kit does not run, and
the tool is never deployed. The offered fix downgrades drizzle-kit to 0.18 (breaking), so it was not applied.

## Potential risks not validated or not fixed here

- **Results and experience points come from the browser.** `/api/results` validates ranges and checks competitive and
  placement results against keystroke timings, but practice results and their XP can be fabricated by a signed-in user
  (at most 120 per hour). This affects game fairness, not other users' data.
- **Rate limits are per process and in memory.** Several instances, or a restart, reset them; the database lock and
  single-use token records persist. A shared store is needed if the app is scaled out.
- **Text verification questions** can be answered by a program, by design (accessibility); the other layers do not
  depend on them. Turnstile is the stronger option when configured.
- **`style-src 'unsafe-inline'`** remains in the CSP because Svelte components set inline styles.
- **Profile picture caching:** pictures are cached publicly for a day, so a picture can remain in shared caches for up to
  a day after a profile is made private.
- **Infrastructure** (TLS, proxy headers, database network access, backups, Supabase settings) was not tested.

## Required configuration (unchanged)

`PUBLIC_SITE_URL` must be the HTTPS origin users visit; behind a proxy set `ADDRESS_HEADER` and `XFF_DEPTH` (see
DEPLOYMENT.md). Serve requests with the restricted database role described there.

## Verification

Type check clean; 147 unit tests and 74 end-to-end tests (production build) pass, including the new regression tests;
production dependency audit clean.
