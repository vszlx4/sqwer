# Deploying sqwer

## Requirements

- Node.js 24 or later
- PostgreSQL 15 or later (optional locally; required in production)
- A reverse proxy that terminates HTTPS (for example Caddy, nginx or a managed platform)

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | **Yes, at build time and run time** | Public origin, for example `https://sqwer.example`. Used for CSRF protection of forms, canonical URLs, the sitemap and social previews. Build with the same value you serve. |
| `DATABASE_URL` | Yes in production | PostgreSQL connection string for the application role (see below). Without it, an embedded PostgreSQL is stored in `SQWER_DATA_DIR`. |
| `DATABASE_URL` with Supabase | | Use the **session pooler** address (Supabase dashboard: Connect, then Session pooler), for example `postgresql://postgres.<project-ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`. The direct `db.<project-ref>.supabase.co` host has only an IPv6 address and fails with `ENOTFOUND` on networks without IPv6. |
| `DATABASE_CA_FILE` | With a hosted database | Certificate authority of the database server (for Supabase, `supabase-ca.crt`), so the TLS connection is verified. A relative path is resolved next to the `.env` file. |
| `CAPTCHA_HMAC_SECRET`, `CAPTCHA_HMAC_KEY_SECRET` | Recommended | Secrets that sign the verification challenges (proof of work and the typed challenge). Generated and stored in `SQWER_DATA_DIR/secrets.json` when absent. |
| `TOTP_ENCRYPTION_SECRET` | Recommended | Key that encrypts administrators' authenticator-app secrets (AES-256-GCM). Generated when absent. **Changing it makes every administrator set up their app again** (`npm run admin -w web -- reset-2fa <email>`). |
| `LOG_HASH_SECRET` | Recommended | Key used to hash IP addresses in security logs. Generated when absent. |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Recommended | Cloudflare Turnstile keys (free). When both are set, Turnstile protects sign-up, sign-in and password reset, with sqwer's own check as the automatic fallback. When unset, sqwer's own check is used. See [BOT_PROTECTION.md](BOT_PROTECTION.md). |
| `ANALYTICS_DISABLED` | No | `1` turns off browser analytics (no consent banner); server events are still recorded. See [ANALYTICS.md](ANALYTICS.md). |
| `ANALYTICS_RETENTION_DAYS` | No | Days raw analytics events are kept (default 395, about 13 months, as the Privacy Policy states). |
| `DATABASE_MIGRATIONS` | Recommended in production | `manual`: the app never changes the schema and refuses to start while a migration is pending, with an instruction to run `npm run db:migrate -w web`. Unset: pending migrations are applied when the app first connects (needs the owner role). |
| `MIGRATION_DATABASE_URL` | With `manual` | Connection string of the owner role, used only by `npm run db:migrate -w web`. Never give it to the running app. |
| `DATABASE_APP_ROLE` | No | The restricted role every request runs as (default `sqwer_app`; `none` switches this off). The app creates it if needed, grants it row access to every table and nothing more, and refuses to start if requests would not run as it. When `DATABASE_URL` is the owner, each connection switches to the role with `SET ROLE`; for full separation give the role its own login and use it as `DATABASE_URL` (below). |
| `DATABASE_POOL_SIZE` | No | Connections per server process (default 5). Keep the total across processes below the database's limit. |
| `DATABASE_STATEMENT_TIMEOUT_MS` | No | Longest a single query may run (default 15000). Connections time out after 10 s and idle transactions after 30 s. |
| `SQWER_DATA_DIR` | No | Directory for the embedded database and generated secrets. Defaults to `.data` in the working directory. |
| `BODY_SIZE_LIMIT` | No | The server's overall ceiling (6M in the start script, for the finger map). Each route has a smaller limit on top (`src/lib/server/body-limits.ts`): 64 KB for forms and most endpoints, 1 MB for results and statistics, 1.5 MB for profile pictures, 6 MB only for the finger map. |
| `PORT`, `HOST` | No | Listening address for the Node server (default port 3000). |
| `ADDRESS_HEADER`, `XFF_DEPTH` | Behind a proxy (essential) | Set `ADDRESS_HEADER=x-forwarded-for` and `XFF_DEPTH=1` (one proxy) so rate limiting and bot protection see real client addresses. Behind Cloudflare's proxy, use `ADDRESS_HEADER=cf-connecting-ip` instead. Without this, every visitor shares the proxy's address and limits apply to everyone at once. |
| `PROTOCOL_HEADER`, `HOST_HEADER` | Behind a proxy | Set to `x-forwarded-proto` and `x-forwarded-host` if the proxy rewrites them. |

Generate secrets with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.

## Build and run

```sh
npm ci
PUBLIC_SITE_URL=https://sqwer.example npm run build
PUBLIC_SITE_URL=https://sqwer.example DATABASE_URL=postgres://... npm start
```

Database migrations live in `apps/web/drizzle`. In production, apply them before starting a new version, with the
owner role, then start the app with the restricted role (see below):

```sh
MIGRATION_DATABASE_URL=postgresql://sqwer_owner:…@host/sqwer DATABASE_APP_ROLE=sqwer_app npm run db:migrate -w web
```

Without `DATABASE_MIGRATIONS=manual`, the app applies pending migrations itself when it first connects, which needs
the owner role. To create a migration after changing `apps/web/src/lib/server/db/schema.ts`, run
`npm run db:generate -w web`.

`GET /healthz` answers `{"status":"ok"}` (200) when the server can reach its database and 503 otherwise, for the
host's health checks.

## Administrators

The analytics dashboard at `/admin/analytics` is available only to administrators. After deploying, grant yourself
the role from the server (it cannot be granted through the website):

```sh
npm run admin -w web -- grant you@example.com
```

`list` and `revoke <email>` are also available, and for incidents `signout <email>` (ends every session of one
account) and `signout-everyone`. See [ANALYTICS.md](ANALYTICS.md).

Administrators must set up an authenticator app (any TOTP app) before the dashboard opens, and confirm a code at the
start of each session (valid for 12 hours). If an administrator loses their app, remove it from the server with
`npm run admin -w web -- reset-2fa <email>`; it is set up again at the next visit, after the password.

Accounts can be suspended from the dashboard (**Users**) or the server: `suspend <email> "<reason>"` blocks sign-in,
ends every session at once and hides the account from leaderboards and public pages; `unsuspend <email>` restores it.
Administrators can only be suspended from the server.

## Database permissions

Serve requests with a role that can only read and write rows, and change the schema only with an owner role, so a
compromised application cannot drop tables, create functions or read other databases. Every table has row-level
security enabled with no general policies, so roles other than the owner see nothing unless they are given a policy;
this keeps Supabase's public API roles (`anon`, `authenticated`) out. The application role gets one policy per table.

**By default the app already serves every request as `sqwer_app`**, whatever `DATABASE_URL` is: at start-up it
applies migrations over a separate owner connection, creates the role if needed, grants it row access, and then
switches every request connection to it (and refuses to start if that fails). This works with your current
`DATABASE_URL` unchanged. Its limit: if `DATABASE_URL` is the owner, code running inside the server could switch back
with `RESET ROLE`. For full separation, give the role its own login as below, so the server never holds owner
credentials.

```sql
-- As a superuser (self-hosted PostgreSQL)
CREATE ROLE sqwer_owner LOGIN PASSWORD '…';
CREATE ROLE sqwer_app LOGIN PASSWORD '…' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE DATABASE sqwer OWNER sqwer_owner;
\c sqwer
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO sqwer_app;
```

On Supabase, run only the second statement in the SQL editor (the tables are owned by `postgres`, which acts as the
owner role), and connect through the session pooler with the user name `sqwer_app.<project-ref>`.

Then, for the first deployment and every deployment with new migrations:

```sh
MIGRATION_DATABASE_URL=<owner connection string> DATABASE_APP_ROLE=sqwer_app npm run db:migrate -w web
```

and run the app with `DATABASE_URL` pointing at `sqwer_app` and `DATABASE_MIGRATIONS=manual`. The app role cannot
create, alter or drop tables, bypass row-level security or create roles. This setup is covered by a unit test
(`apps/web/src/lib/server/hardening.test.ts`) that runs the migrations, grants the role and checks what it can and
cannot do.

## Security measures in place

- HTTPS-only session cookie (`HttpOnly`, `SameSite=Lax`, `Secure` over HTTPS); HSTS on HTTPS responses.
- CSRF: SvelteKit rejects cross-origin form submissions; API writes require a same-origin `Origin` header and JSON.
- No CORS headers are sent, so other sites cannot read API responses.
- Passwords hashed with scrypt; recovery codes and session tokens stored only as SHA-256 hashes.
- All sessions are ended when a password is changed or reset; recovery codes are single-use.
- Generic error messages and constant-time password checks prevent account enumeration.
- Sign-in locked for 15 minutes after five failures from one address or ten from all addresses, with the same answer for registered and unregistered email addresses; rate limits on sign-up, sign-in, password reset and APIs.
- Redirect targets after sign-in are resolved as a browser would and must stay on the site.
- sqwer's own verification on account forms: a background proof-of-work check plus distorted characters to type, with a text question as an accessible alternative; every challenge is signed, expires after ten minutes and is single-use. Also a hidden trap field and a minimum form-fill time.
- Content Security Policy limiting scripts, styles, images, fonts and connections to the site's own origin, with a nonce for inline scripts; `frame-ancestors 'none'`.
- Acceptance of the Terms and Privacy Policy (version and time), the age confirmation, and the rights confirmation for profile pictures are recorded.
- Input validated and sanitised (control and direction-override characters removed) before storage; output escaped.
- Security events written as structured JSON to standard output, with IP addresses hashed; recent events shown to the user.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.

- Sessions end 30 days after last use and at most 90 days after sign-in; signing in, signing up or resetting a
  password ends any session the browser already had.
- New passwords are checked against a list of very common passwords and against repeated or sequential characters.
- Cross-Origin-Opener-Policy and Cross-Origin-Resource-Policy `same-origin`; `X-Permitted-Cross-Domain-Policies: none`.
- Unexpected errors show a short reference; the details are logged on the server only (`"kind":"error"`).
- Database connections time out; queries are limited to 15 seconds; per-user tables are indexed.
- The public leaderboards are computed at most every 30 seconds; data downloads and analytics exports are rate limited
  and recorded; analytics ingestion is limited per address, per network and for the whole site.
- At start-up the server logs a warning (`"kind":"config"`) for unsafe settings on a public site: no HTTPS, missing or
  short secrets, no `DATABASE_URL`, an incomplete Turnstile key pair, or a Turnstile test secret (which is refused).

Rate limits are held in memory and apply per server process. If you run several instances, move them to a shared store.

## Recurring tasks

- **Backups:** schedule `npm run db:backup -w web` daily (for example with cron). It keeps 14 days of backups in
  `apps/web/backups`, as the Privacy Policy states.
- **security.txt:** `/.well-known/security.txt` expires one year after the security policy's effective date. Review the
  policy and update its date in `apps/web/src/lib/site/legal.ts` before then.
- **Legal documents:** when a document changes in substance, raise its version and effective date in
  `apps/web/src/lib/site/legal.ts` and add a line to its version history.
- **Analytics:** daily totals and the 13-month retention run automatically inside the server every six hours; nothing
  needs scheduling. Review the administrators with `npm run admin -w web -- list` from time to time.

## Infrastructure the application cannot provide

The application limits abuse per address, network and account, but it cannot absorb volumetric or distributed
denial-of-service attacks, terminate TLS or filter traffic before it arrives. Provide these in front of it:

- **HTTPS only**, with HTTP redirected to HTTPS and TLS 1.2 or later (Caddy, nginx, or the platform's load balancer).
- **A CDN or managed DDoS protection with a web application firewall**, for example Cloudflare in proxy mode (then set
  `ADDRESS_HEADER=cf-connecting-ip`). Rate-limit rules at the edge for `/signin`, `/signup`, `/reset-password` and
  `/api/` add a layer the application cannot be overwhelmed past.
- **Only the proxy may reach the Node server**: bind it to localhost or a private network and firewall the port.
  `ADDRESS_HEADER` must only be trusted when every request comes through that proxy.
- **The database must not be open to the internet**: on Supabase, enable network restrictions to the server's address
  and keep SSL enforcement on; use the session pooler with the certificate in `DATABASE_CA_FILE`.
- **One server process**, or a shared store for rate limits (see above). Run it under a process manager that restarts
  it (systemd, the platform's runner) and point health checks at `/healthz`.
- **Logs**: keep standard output and standard error for 14 days (as the Privacy Policy states), readable only by
  administrators, and alert on bursts of `"event":"sign_in_failed"`, `"account_locked"`, `"captcha_failed"`,
  `"bot_trap"`, `"admin_denied"` and `"kind":"error"`.
- **Backups**: run `npm run db:backup -w web` daily on a machine whose disk is encrypted, copy the files off the
  server, and test a restore regularly (see below). Supabase's own backups depend on the plan.

## Production checklist

Before the first public deployment:

1. Set `PUBLIC_SITE_URL` to the HTTPS address, and generate `CAPTCHA_HMAC_SECRET`, `CAPTCHA_HMAC_KEY_SECRET` and
   `LOG_HASH_SECRET` (32 random bytes each) in the server's environment, not in the repository.
2. Create the restricted database role, run `npm run db:migrate -w web` with the owner role and `DATABASE_APP_ROLE`,
   and start the app with the restricted role and `DATABASE_MIGRATIONS=manual`.
3. Put the server behind the HTTPS proxy, set `ADDRESS_HEADER` and `XFF_DEPTH` to match it, and firewall the port.
4. Configure Turnstile with a real (not test) key pair for the production hostname.
5. Restrict database network access; confirm row-level security is enabled on every table (Supabase: Advisors).
6. Start the server and check the log: there must be no `"kind":"config"` warnings. Open `/healthz`.
7. Grant yourself administrator rights and sign in once; check the response headers (`Strict-Transport-Security`,
   `Content-Security-Policy`) and that the session cookie is `Secure`.
8. Schedule the daily backup and test one restore into a separate database.
9. Set up log retention and the alerts above.

## Incident response

| Situation | What to do |
| --- | --- |
| An account may be compromised | `npm run admin -w web -- signout <email>`; ask the owner to reset their password with a recovery code; review `security_events` for the account. If it is an administrator, `revoke` first. |
| Sessions or the database may have leaked | `npm run admin -w web -- signout-everyone`. Session tokens are stored only as hashes, so a database copy does not contain usable cookies, but ending every session is cheap and certain. |
| A secret is exposed | Database password: change it at the provider, update `DATABASE_URL`, restart. `CAPTCHA_HMAC_SECRET` or `CAPTCHA_HMAC_KEY_SECRET`: replace and restart (open forms and challenges must be reloaded). `LOG_HASH_SECRET`: replace and restart (older log hashes no longer match new ones). Turnstile secret: rotate it in the Cloudflare dashboard. Then remove the secret from wherever it leaked; if it was committed, treat it as public even after removal. |
| Suspicious activity | Search the logs for the `kind`/`event` fields above and for the error reference users report. IP addresses appear only as keyed hashes, which can be compared with the hash of a known address using `LOG_HASH_SECRET`. |
| Data loss or corruption | Stop the app; restore the latest good backup into a new database with `pg_restore --clean --if-exists --no-owner -d <new database> <file>`, check it, point `DATABASE_URL` at it, run `npm run db:migrate -w web`, start. |
| A security fix must ship now | Fix on `main`, run `npm run check -w web`, `npm test` and `npm run test:e2e`, build, deploy, and confirm `/healthz`. To roll back, deploy the previous commit; migrations only add, so the previous version runs against the newer schema. |
| Personal data breach | The Privacy Policy (section 12) commits to notifying the supervisory authority within 72 hours where required and affected people without undue delay. Record what happened, when, which data and which accounts. |

Security reports from others arrive through `/.well-known/security.txt` and the Security Policy page.

