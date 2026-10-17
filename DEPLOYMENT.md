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
| `LOG_HASH_SECRET` | Recommended | Key used to hash IP addresses in security logs. Generated when absent. |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Recommended | Cloudflare Turnstile keys (free). When both are set, Turnstile protects sign-up, sign-in and password reset, with sqwer's own check as the automatic fallback. When unset, sqwer's own check is used. See [BOT_PROTECTION.md](BOT_PROTECTION.md). |
| `SQWER_DATA_DIR` | No | Directory for the embedded database and generated secrets. Defaults to `.data` in the working directory. |
| `BODY_SIZE_LIMIT` | No | Maximum request body size. The start script sets `6M`, enough for a large finger map. |
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

Database migrations in `apps/web/drizzle` are applied automatically on start-up. To create a new migration after
changing `apps/web/src/lib/server/db/schema.ts`, run `npm run db:generate -w web`.

## Database permissions

Run migrations with an owner role and serve requests with a restricted role that can only read and write rows.

```sql
-- As a superuser
CREATE ROLE sqwer_owner LOGIN PASSWORD '…';
CREATE ROLE sqwer_app LOGIN PASSWORD '…';
CREATE DATABASE sqwer OWNER sqwer_owner;

\c sqwer
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO sqwer_app;

-- After the first start with DATABASE_URL pointing at sqwer_owner (which creates the tables):
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sqwer_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sqwer_app;
ALTER DEFAULT PRIVILEGES FOR ROLE sqwer_owner IN SCHEMA public
	GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sqwer_app;
ALTER DEFAULT PRIVILEGES FOR ROLE sqwer_owner IN SCHEMA public
	GRANT USAGE, SELECT ON SEQUENCES TO sqwer_app;
```

Then run the application with `DATABASE_URL` pointing at `sqwer_app`. The app role cannot create, alter or drop
tables. Run the owner role again only when deploying a version with new migrations.

## Security measures in place

- HTTPS-only session cookie (`HttpOnly`, `SameSite=Lax`, `Secure` over HTTPS); HSTS on HTTPS responses.
- CSRF: SvelteKit rejects cross-origin form submissions; API writes require a same-origin `Origin` header and JSON.
- No CORS headers are sent, so other sites cannot read API responses.
- Passwords hashed with scrypt; recovery codes and session tokens stored only as SHA-256 hashes.
- All sessions are ended when a password is changed or reset; recovery codes are single-use.
- Generic error messages and constant-time password checks prevent account enumeration.
- Account lock for 15 minutes after five failed sign-ins; rate limits on sign-up, sign-in, password reset and APIs.
- sqwer's own verification on account forms: a background proof-of-work check plus distorted characters to type, with a text question as an accessible alternative; every challenge is signed, expires after ten minutes and is single-use. Also a hidden trap field and a minimum form-fill time.
- Content Security Policy limiting scripts, styles, images, fonts and connections to the site's own origin, with a nonce for inline scripts; `frame-ancestors 'none'`.
- Acceptance of the Terms and Privacy Policy (version and time), the age confirmation, and the rights confirmation for profile pictures are recorded.
- Input validated and sanitised (control and direction-override characters removed) before storage; output escaped.
- Security events written as structured JSON to standard output, with IP addresses hashed; recent events shown to the user.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.

Rate limits are held in memory and apply per server process. If you run several instances, move them to a shared store.

## Recurring tasks

- **Backups:** schedule `npm run db:backup -w web` daily (for example with cron). It keeps 14 days of backups in
  `apps/web/backups`, as the Privacy Policy states.
- **security.txt:** `/.well-known/security.txt` expires one year after the security policy's effective date. Review the
  policy and update its date in `apps/web/src/lib/site/legal.ts` before then.
- **Legal documents:** when a document changes in substance, raise its version and effective date in
  `apps/web/src/lib/site/legal.ts` and add a line to its version history.
