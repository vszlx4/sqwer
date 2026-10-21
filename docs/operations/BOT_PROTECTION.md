# Bot protection

How sqwer protects sign-up, sign-in and password reset against automated abuse: fake registrations, password
guessing, credential stuffing, spam submissions and scripted use of the endpoints. Every check runs on the server;
nothing can be bypassed by changing the page or by sending requests to the endpoints directly.

## 1. Analysis of the previous implementation

The previous protection was sqwer's own check: an ALTCHA proof of work plus a typed challenge (distorted characters,
or a short text question for accessibility), with in-memory rate limits, a hidden field and a minimum fill time on
sign-up.

What it did well: verification was on the server; tokens were HMAC-signed, expired after ten minutes and were
single-use; answers were compared in constant time; sign-in hashed a dummy password for unknown accounts, so timing
did not reveal which emails exist; form posts had SvelteKit's origin check and the JSON API required same-origin
requests.

Weaknesses found:

| # | Weakness | Consequence |
|---|---|---|
| 1 | The text question had three fixed wordings, answerable with one regular expression (the test suite did exactly that). The distorted characters are within reach of vision-capable AI models. | Any script could choose the text question and pass. |
| 2 | Challenges were not bound to the form or to the browser. | A challenge fetched on sign-in was accepted on sign-up, and one solved in one browser (or by a paid solving farm) was accepted from another. |
| 3 | Replay protection lived only in memory (20,000-entry caches). | A restart made unexpired tokens reusable; flooding the cache evicted entries. |
| 4 | The rate limiter cleared all keys when it held more than 50,000. | Sign-in attempts with new email addresses each created a key, so an attacker could reset everyone's limits, including per-address limits. |
| 5 | The sign-up "started at" time was a plain hidden field. | A script could send any value and skip the minimum fill time. |
| 6 | Five failed sign-ins from anywhere locked the account for 15 minutes. | Anyone could keep any account locked out. |
| 7 | The password checks on Account → Your data (clear data, delete account) had no rate limit. | A stolen session could be used to guess the password. |
| 8 | Every sign-in required the full challenge; there were no risk signals. | Unnecessary friction for people, no extra scrutiny for suspicious requests. |
| 9 | The Content Security Policy allowed only sqwer's own scripts and frames. | A third-party widget such as Turnstile could not load. |
| 10 | (Security audit, October 2026.) Each character of the image challenge was drawn from a fixed path, with the distortion applied as a separate `transform`. | A script could read the answer from the SVG markup by matching the path data, without recognising any image. Characters are now drawn with the distortion and random jitter applied to every point, and the elements are shuffled, so the markup reveals neither the characters nor their order. |
| 11 | (Security audit, October 2026.) A registered account was locked after ten failures, while an unregistered address kept getting "incorrect". | The lock message revealed which email addresses are registered. Both are now locked by the same count with the same message. |

## 2. Options evaluated

| Option | Security against current bots | Integration | Privacy | Reliability | Cost |
|---|---|---|---|---|---|
| **Cloudflare Turnstile** (chosen) | Strong: browser and network signals, managed challenges, single-use tokens bound to an action | Low: one script, one server call | Good: no advertising use; IP address and browser signals go to Cloudflare (United States) | High, but a third-party dependency | Free, unlimited |
| hCaptcha | Strong | Low | Fair: visible puzzles; data to Intuition Machines | High | Free tier with limits |
| Google reCAPTCHA v3 | Strong (score-based) | Low | Poor: data to Google; advertising concerns | High | Free up to a quota |
| Friendly Captcha | Medium (proof of work) | Low | Very good (EU) | High | Free only for small non-commercial use |
| sqwer's own check (ALTCHA + typed challenge) | Weak against AI models and solving farms; slows bulk automation | Already built | Best: no third party | Depends only on sqwer | Free |

**Decision:** Cloudflare Turnstile as the primary verification, with sqwer's own check kept, hardened and used as the
automatic fallback, plus layers that do not depend on any verification. Until Turnstile keys are configured, sqwer's
own check is used everywhere, exactly as before but hardened.

## 3. How it works

Code: `apps/web/src/lib/server/bot/` (`guard.ts`, `ticket.ts`, `risk.ts`, `turnstile.ts`, `replay.ts`),
`apps/web/src/lib/server/captcha.ts`, `apps/web/src/lib/server/rate-limit.ts`, and on the page
`apps/web/src/lib/ui/HumanCheck.svelte`, `Turnstile.svelte`, `Captcha.svelte`, `formSignals.ts`.

Each protected submission passes, in order:

1. **Rate limits**, checked before anything else:
   - Sign-up: 5 per address, 20 per network (/24 or /48) and 300 across the site, per hour.
   - Sign-in: 20 per address and 100 per network per 15 minutes; 5 failures per email address and client address, and
     10 per email address from all client addresses, per 15 minutes, after which sign-in for that email address is locked
     for 15 minutes. Both counts are kept for every email address entered, registered or not, and give the same answer,
     so the lock does not reveal which addresses have accounts. Existing accounts are also locked in the database, so
     the lock survives a restart.
   - Password reset: 6 per address and 5 per account, per hour.
   - Challenge endpoint: 60 per address and 300 per network per 10 minutes.
2. **Hidden field.** A field people never see or fill in. If it is filled, the request is refused.
3. **Form ticket.** Signed with a server secret (HMAC-SHA-256) when the page loads. It names the action, carries a hash
   of the user agent, expires after two hours and is accepted once. Sign-up is refused without a valid ticket or if it
   arrives less than 2.5 s after the page loaded. For sign-in and reset, a missing, spent, foreign or very fast ticket
   raises the risk score. Every refusal carries a fresh ticket for the next attempt.
4. **Risk score.** It is the sum of:
   - **Request signals:** no or automation-like user agent (HTTP libraries, headless browsers), no `Accept-Language`,
     missing or cross-site Fetch Metadata.
   - **Behaviour:** the interaction summary the page sends, which counts key presses, pointer use, focus and pastes
     (never what was typed), the fill time and `navigator.webdriver`.
   - **The ticket**, as above.
   - **History:** recent failures from the address or its network.

   A score of 30 or more requires verification. Signals never block on their own.
5. **Verification:**
   - **Which forms:** sign-up and password reset always verify. Sign-in verifies:
     - when the risk score is 30 or more;
     - after any recent failure from the address;
     - while failures spike across all addresses (60 in 10 minutes, a sign of distributed credential stuffing);
     - and always when Turnstile is configured, because its managed check is usually invisible.
   - **Turnstile:** the token is sent to Cloudflare's Siteverify API with the secret, the client address and an
     idempotency key (one retry on network failure, 5 s timeout). It must succeed, name this site's hostname and this
     form's action, and be under five minutes old. Its hash is also recorded as used, so it is accepted once here.
   - **sqwer's own check:**
     - The proof of work and the typed answer are verified on the server.
     - The challenge is bound to the action and to the browser's user agent.
     - The token is accepted once, whether the answer is right or wrong.
     - Text questions come in several phrasings.
     - Its use is limited per address: 5 an hour while Turnstile is configured and answering, 60 otherwise.
6. **Replay protection.** Challenge identifiers, proof-of-work solutions, form tickets and Turnstile token hashes are
   recorded in the `used_tokens` table with an atomic insert. Exactly one of two simultaneous uses succeeds, and the
   record survives restarts and is shared by every server process.

**Failures and recovery:**
- **What people see:** messages are generic ("Please complete the verification.", "The verification expired or was
  already used.", "Too many attempts. Please try again in N minutes."), never which signal triggered.
- **What is logged:** the exact reason goes to the security log (`bot_trap`, `captcha_failed`, `rate_limited`, with
  a hashed IP address).
- **When Turnstile fails:**
  - If its script cannot load (network filters, outages), the page switches to sqwer's own check.
  - If Siteverify does not answer, the server says so and the page shows sqwer's own check.
  - Either way, a person can still sign in or register, and security is not relaxed: the fallback is fully verified
    and separately rate-limited.

Other endpoints:
- **Your data:** the password checks on Account → Your data are limited to 10 per account per hour.
- **Changing your password or recovery codes:** these already had per-account limits.
- **JSON API:** requests that change data must come from the same origin, as JSON, from a signed-in user.

## 4. Configuration

| Variable | Required | Purpose |
|---|---|---|
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Recommended | Enable Cloudflare Turnstile. Both must be set; otherwise sqwer's own check is used. |
| `CAPTCHA_HMAC_SECRET`, `CAPTCHA_HMAC_KEY_SECRET` | Recommended | Sign the form tickets and sqwer's own challenges. Generated into `SQWER_DATA_DIR/secrets.json` when absent. Keep them stable across restarts and identical on every server process. |
| `LOG_HASH_SECRET` | Recommended | Hashes IP addresses in the security log. |
| `PUBLIC_SITE_URL` | Yes | Its hostname is the one Turnstile tokens must name. |
| `ADDRESS_HEADER`, `XFF_DEPTH` | Essential behind a proxy | So that limits and risk see real client addresses: `x-forwarded-for` with depth 1 behind one proxy, or `cf-connecting-ip` behind Cloudflare's proxy. Without it every visitor shares the proxy's address. |

### Setting up Turnstile

1. Cloudflare dashboard → **Turnstile** → **Add widget**. A Cloudflare account is required; the site does not need to
   use Cloudflare's DNS or proxy.
2. Add the site's hostname (for example `sqwer.example`; add `localhost` only for a development widget).
3. Widget mode: **Managed**. Pre-clearance: off.
4. Copy the site key and the secret key into `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` and restart. The Content
   Security Policy already allows `https://challenges.cloudflare.com` for scripts and frames.

For local development, Cloudflare's published test keys work. They are not for production; with them, the hostname and
action checks are skipped:

| Key | Behaviour |
|---|---|
| Site key `1x00000000000000000000AA` | Always passes |
| Secret `1x0000000000000000000000000000000AA` | Always passes |
| Secret `2x0000000000000000000000000000000AA` | Always fails |

Every test-key token is the same dummy string, so after the first use this site's replay protection refuses it. Use a
fresh database (`SQWER_DATA_DIR`) for repeated manual tests.

**Legal:** the Privacy Policy (section 4.2 and the processors table) and the Cookie and Storage Policy describe
Turnstile as active "where enabled". Enabling it makes Cloudflare a processor; review the transfer wording with your
legal adviser before going live.

## 5. Limitations

- **AI browser agents and careful scripts cannot be reliably identified.** An agent driving a real browser, typing at
  human speed and hiding `navigator.webdriver` looks like a person to every signal used here. The design does not rely
  on spotting them: it makes each attempt cost a verification, limits attempts per address, network and account, and
  watches for site-wide spikes.
- **sqwer's own check can be solved** by image-reading models, text parsers or paid solving services. It is a
  fallback; with Turnstile configured it is limited to 5 uses per address per hour while Turnstile is answering.
- **Turnstile depends on Cloudflare.** During an outage the weaker fallback is used.
- **Rate limits and risk history are in memory, per server process.** They reset on restart and are not shared
  between processes. Replay protection is in the database and is shared. To run several processes, move the limiter to
  a shared store such as Redis or a database table.
- **Address-based limits** can be spread across large pools of residential proxies. The per-account and site-wide
  limits, and attack mode, are what slow distributed attacks.
- **Tickets and challenges are bound to the user agent, not the address,** so changing networks (for example mobile
  data) never breaks a form. A stolen ticket used from another browser only raises the risk score.
- **No email verification.** sqwer does not send email, so a registration cannot be tied to a working mailbox;
  registration limits and verification are the controls.

## 6. Testing

Automated tests run with `npm test` (unit) and `npx playwright test` in `apps/web` (end to end). Unit tests use a
throwaway embedded database per test file and never read `.env`.

| Scenario | How it was tested | Result |
|---|---|---|
| Direct requests with no page (no ticket, no verification) to sign-in, sign-up and reset | End to end: plain HTTP posts | Refused |
| Forged ticket, missing ticket, ticket from another form, altered ticket, oversize ticket | Unit and end to end | Refused |
| Ticket replay | Unit and end to end (same ticket twice) | Second use refused |
| Sign-up sent faster than a person could fill it | End to end | Refused |
| Hidden field filled | Unit and end to end | Refused |
| Solved verification replayed (identical request sent twice) | End to end | Second request refused |
| Challenge solved for sign-in used to register | Unit and end to end | Refused |
| Challenge used from another browser (different user agent) | Unit | Refused |
| Expired challenge (after ten minutes) and expired ticket (after two hours) | Unit, with a simulated clock | Refused |
| Tampered challenge token (changed expiry and action) | Unit | Refused |
| Wrong answer; same token tried again | Unit and end to end | Refused; token spent by any attempt |
| Two simultaneous uses of one token | Unit | Exactly one accepted |
| Turnstile: valid token, wrong action, wrong hostname, duplicate, stale (over five minutes), invalid, missing, oversize | Unit, simulated Siteverify | Only the valid token accepted |
| Turnstile: network failure then success; repeated failure; Cloudflare internal error | Unit, simulated Siteverify | Retries once with the same idempotency key; then "unavailable" and fallback |
| Turnstile with Cloudflare's always-pass test keys: full registration in a real browser | Manual, live against Cloudflare | Account created |
| Same Turnstile token replayed | Manual, live | Refused |
| Turnstile with Cloudflare's always-fail secret | Manual, live | Refused, logged as `turnstile-invalid` |
| Cloudflare blocked in the browser | Manual, live | Widget fails, sqwer's own check shown, sign-in succeeds |
| Automated registration loop (7 attempts from one address) | End to end | Attempts 6 and 7 refused with "Too many attempts" |
| Credential stuffing (24 sign-ins for different accounts from one address) | End to end | Limited after 20 |
| Distributed failures (60 across many addresses) | Unit | Attack mode: every sign-in must verify |
| Flooding the rate limiter with 120,000 new keys | Unit | Existing limits survive |
| HTTP libraries, headless browsers, cross-site requests, `navigator.webdriver` | Unit | Scored above the verification threshold |
| Ordinary browser filling the form normally | Unit | Signs in without a challenge |
| Existing site behaviour (accounts, sign-in, reset, lock-out, lessons, tests, data, accessibility audits) | End to end | All passing |

At the time of writing: 115 unit tests and 64 end-to-end tests pass, including 6 end-to-end abuse tests, and the live
Turnstile checks above passed against Cloudflare's test keys.
