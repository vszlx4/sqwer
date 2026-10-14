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
| `CAPTCHA_HMAC_SECRET`, `CAPTCHA_HMAC_KEY_SECRET` | Recommended | Secrets that sign bot-check challenges. Generated and stored in `SQWER_DATA_DIR/secrets.json` when absent. |
| `LOG_HASH_SECRET` | Recommended | Key used to hash IP addresses in security logs. Generated when absent. |
| `SQWER_DATA_DIR` | No | Directory for the embedded database and generated secrets. Defaults to `.data` in the working directory. |
| `BODY_SIZE_LIMIT` | No | Maximum request body size. The start script sets `6M`, enough for a large finger map. |
| `PORT`, `HOST` | No | Listening address for the Node server (default port 3000). |
| `ADDRESS_HEADER`, `XFF_DEPTH` | Behind a proxy | Set `ADDRESS_HEADER=x-forwarded-for` and `XFF_DEPTH=1` so rate limiting sees real client addresses. |
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
- Self-hosted proof-of-work bot check, hidden trap field and minimum form-fill time on account forms.
- Input validated and sanitised (control and direction-override characters removed) before storage; output escaped.
- Security events written as structured JSON to standard output, with IP addresses hashed; recent events shown to the user.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.

Rate limits are held in memory and apply per server process. If you run several instances, move them to a shared store.
