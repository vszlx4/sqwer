# Analytics

sqwer measures its own traffic and account activity with a first-party analytics system built into the
application. This document covers how it works, what it records, how to configure and operate it, and who can see
the results. The user-facing description is in the Privacy Policy (paragraph 4.4, `/privacy#analytics`) and the
Cookie and Storage Policy (section 5, `/cookies#analytics`). Keep all three in step.

## Why first-party instead of a third-party service

| | First-party (chosen) | Hosted service (for example Plausible, Fathom, Google Analytics) |
| --- | --- | --- |
| Data location | sqwer's own database (EU), no new processor | A new processor; for some providers, transfers outside the EU |
| Policies | Content Security Policy unchanged; no third-party script | A third-party script or proxy, and a CSP exception |
| Server events | Registrations, sign-ins and failures recorded on the server, where they cannot be blocked or forged | Usually browser-reported, so blocked by content blockers and open to forgery |
| Join with accounts | Signed-in visits and account events can be counted together | Requires sending an account identifier to the provider |
| Cost and upkeep | No fee; the code in this repository must be maintained | Fee or self-hosting; less code here |
| Features | Exactly what the dashboard needs | More features (funnels, real-time views, goals) out of the box |

For a small, non-commercial site that already treats privacy as a feature, first-party analytics avoids a new
processor and a script exception, and keeps the most important events (registrations and sign-ins) server-side and
trustworthy.

## Architecture

```
Browser (after consent)                 Server                                  Database
lib/analytics/consent.svelte.ts   ──►   POST /api/analytics                ──►  analytics_events
lib/analytics/tracker.ts                 validate (zod), rate limit,               (raw, 13 months)
lib/analytics/Analytics.svelte           drop bots, parse user agent
                                         lib/server/analytics/ingest.ts
                                                                                    │
Form actions and API endpoints     ──►  track(name, …) (fire and forget)   ──►    │
                                         lib/server/analytics/track.ts              │
                                                                                    ▼
                                         Maintenance every 6 hours          ──►  analytics_daily
                                         lib/server/analytics/maintenance.ts       (daily totals, kept)
                                                                                    │
/admin/analytics (administrators)  ◄──  lib/server/analytics/query.ts      ◄──────┘
/admin/analytics/events                  bounded, indexed, cached 60 s
/admin/analytics/export (CSV)
```

### Browser events (consent required)

- Nothing is sent, and no identifier is stored, until the visitor selects **Allow** in the banner. Global Privacy
  Control and Do Not Track are treated as a refusal, and the banner is not shown.
- The visitor identifier (`sqwer:analytics-id`, local storage) and visit identifier (`sqwer:analytics-session`,
  session storage, rotated after 30 minutes of inactivity) are random UUIDs. Withdrawing consent deletes both.
- `pageview` events carry the path (no query string or fragment), the SvelteKit route, and on the first page of a
  visit only, the referrer and the `utm_source`, `utm_medium` and `utm_campaign` tags.
- `engagement` events carry how long the page was visible (`visibilitychange`, navigation and `pagehide`).
- Events are batched (up to 20) and sent with `fetch(..., { keepalive: true })`, or `navigator.sendBeacon` as the
  page is hidden. A failed send is dropped; analytics never surfaces as an error in the page.
- `/admin` pages are never tracked.

### Server events (no consent banner; legitimate interest)

Recorded with `track()` at the point where the action is confirmed. They carry no visitor identifier, IP address or
user agent. Successful actions taken while signed in are linked to the account (the link is removed if the account is
deleted: `user_id` uses `ON DELETE SET NULL`).

| Event | Where | Details (`props`) |
| --- | --- | --- |
| `signup_completed` | `routes/signup/+page.server.ts` | none |
| `signin_succeeded` | `routes/signin/+page.server.ts` | none |
| `signin_failed` | `routes/signin/+page.server.ts` | `reason`: `credentials`, `locked`, `rate_limited`, `blocked` or `verification` |
| `password_reset` | `routes/reset-password/+page.server.ts` | none |
| `profile_completed` | `routes/account/setup/+page.server.ts` | none |
| `test_completed` | `routes/api/results/+server.ts` | `exam` |
| `ranked_verified` | `routes/api/results/+server.ts` | none |
| `lesson_completed` | `routes/api/courses/+server.ts` | `lesson`, `stars` |
| `placement_applied` | `routes/api/courses/placement/+server.ts` | `chapter` |
| `data_cleared` | `routes/account/data/+page.server.ts` | `category` |
| `account_deleted` | `routes/account/data/+page.server.ts` | none (not linked to the deleted account) |

`track()` never throws and never delays the request: the insert runs in the background, and a failure is logged as a
structured warning (`{"kind":"analytics",...}`). Sign-up and sign-in cannot fail because of analytics.

To add an event, add its name and label to `SERVER_EVENTS` in `src/lib/analytics/shared.ts`, call
`track('name', { userId, props })` after the action succeeds, describe it in the Privacy Policy (paragraph 4.4.4)
and in the table above. Never put an email address, password, IP address or free text in `props`.

### Validation and abuse resistance (`POST /api/analytics`)

- Same-origin JSON only (enforced for all API writes in `hooks.server.ts`).
- 32 KB body cap; 240 requests per client address per 10 minutes.
- Strict schema: 1 to 20 events; UUID event, visitor and visit ids; known event types only; path and route patterns;
  length limits on every string; visible time at most 6 hours.
- Events are accepted only from the last 24 hours to 5 minutes ahead (clock differences).
- The event id is the primary key, so retried batches are stored once (`ON CONFLICT DO NOTHING`).
- Crawlers, link previews, monitoring tools, headless browsers and HTTP libraries are dropped by user agent.
- The signed-in account comes from the session cookie, never from the request body.
- Only `device`, `browser` and `os` labels are derived from the user agent; the string itself is not stored.

### Storage, retention and roll-ups

- `analytics_events`: one row per event. Indexes on `occurred_at`, `(name, occurred_at)`, `(route, occurred_at)`,
  `session_id` and `user_id`.
- `analytics_daily (day, metric, value)`: totals per day (`pageviews`, `visitors`, `sessions`, `registrations`,
  `signins`, `signin_failures`, `tests`, `lessons`). No personal data.
- Maintenance starts one minute after the server starts and repeats every six hours (`hooks.server.ts`, `init`):
  1. summarises every finished day not yet summarised, two days after it ends (late events are accepted for one day);
  2. deletes raw events older than the retention period in batches of 5,000 (at most 200,000 per run).
- Ranges that reach past the retention period use the daily totals. Measures that cannot be derived from daily totals
  (unique visitors across days, single-page visits, time per visit, breakdowns) are reported as unavailable, never
  as zero.

## Dashboard

- `/admin/analytics`: key figures with changes against the previous period of the same length, daily traffic,
  registrations, successful and failed sign-ins, and the top pages, referring sites, channels, devices, browsers,
  operating systems, server events and failed sign-in reasons. Each breakdown links to a filtered view.
- `/admin/analytics/events`: individual events, newest first, filterable by period, page, channel, device, signed-in
  state, event, source, browser, system, referrer and visit, with keyset pagination (stable and equally fast at any
  depth) and a count capped at 10,000.
- `/admin/analytics/export`: the current events view as CSV (RFC 4180), at most 10,000 rows. Cells that a
  spreadsheet could treat as formulas are neutralised. Email addresses, account ids and visitor ids are never exported.
- Every view keeps its period and filters in the address, so it can be bookmarked and shared between administrators.
- A comparison is shown only when collection covered the whole previous period; otherwise the card says
  "No comparison available". Days before collection began are gaps in the charts, not zeros. Visitor filters apply to
  browser analytics only; server events are always site-wide, and the dashboard says so when filters are set.
- Queries are always bounded by the selected period (at most 400 days), served by the indexes above, limited (top 10
  per breakdown, 50 events per page, 10,000 export rows) and cached for 60 seconds per period and filter.

## Permissions

- `users.role` is `user` (default) or `admin`. It is read with every session lookup, so granting or revoking takes
  effect on the next request.
- Pages under `/admin` call `requireAdmin` in their load functions (`src/lib/server/admin.ts`) and in the shared
  layout: visitors who are not signed in are redirected to sign in; signed-in members get **404**, so the pages are
  not revealed. The CSV export calls `requireAdminApi`: **401** without a session, **403** for members.
- Roles cannot be changed through the website. Use the command line on the server:

```sh
npm run admin -w web -- list
npm run admin -w web -- grant person@example.com
npm run admin -w web -- revoke person@example.com
```

The script reads the same `.env` file and database as the app (`DATABASE_URL` and `DATABASE_CA_FILE`, or the embedded
database in `SQWER_DATA_DIR`) and applies pending migrations first. With the embedded database, stop the app before
running it, because only one process can open that database at a time.

## Configuration

| Variable | Default | Effect |
| --- | --- | --- |
| `ANALYTICS_DISABLED` | unset | `1`, `true` or `yes`: browser analytics is off (no banner, `/api/analytics` answers 204). Server events are still recorded. |
| `ANALYTICS_RETENTION_DAYS` | `395` | Days raw events are kept (minimum 30). The Privacy Policy states 13 months; change both together. |

## Migration

`apps/web/drizzle/0012_analytics.sql` adds `users.role` (default `user`), `analytics_events` and `analytics_daily`. It
is applied automatically when the app first connects to the database. If the app runs with a restricted database
role (see DEPLOYMENT.md), apply it once with the owner role. Then grant yourself administrator rights with the command
above.

## Third parties

None. Analytics data is stored only in sqwer's own database, processed by the same hosting and database providers
listed in the Privacy Policy. No analytics script, pixel, cookie or service from another company is used.

## Tests

- Unit (`npx vitest run`, `apps/web/src/lib/server/analytics/analytics.test.ts`): user-agent parsing and bot
  detection, channel and referrer classification, request validation, duplicate events, the accepted time window,
  aggregation accuracy on seeded data (page views, visitors, visits, single-page visits, time per visit, breakdowns and
  filters), server event counts, keyset pagination without gaps or repeats, period comparisons, daily roll-ups and
  retention, dashboard parameters, administrator checks, CSV escaping, and that `track()` never throws.
- End to end (`apps/web/e2e/analytics.spec.ts`, against a production build): nothing is sent before consent, events
  after **Allow**, withdrawal deletes the identifier, Global Privacy Control is honoured, malformed and cross-site
  requests are refused, a real registration and real successful and failed sign-ins appear as events, members get 404
  and 403, signed-out visitors are sent to sign in, and the dashboard, events list and export work for an
  administrator, with automated accessibility checks. The test accounts are created by `apps/web/scripts/seed-e2e.mjs`
  before the test server starts; it refuses to run against anything but a local test database.

## Known limitations

- Visitor numbers count only browsers that allowed analytics, so they understate real traffic. The visitor to
  registration rate on the dashboard therefore overstates the true rate, and the dashboard says so.
- A visitor who clears storage or uses several browsers is counted as several visitors.
- Rate limits are per server process (as elsewhere in sqwer).
- Time is grouped by UTC day.
