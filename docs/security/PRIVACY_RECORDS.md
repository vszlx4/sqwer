# Records of processing and DPIA screening

Kept under Article 30 GDPR (and Article 37 LGPD), alongside the public Privacy Policy (`/privacy`). It describes what
the code in this repository does as of October 2026. Review it whenever processing changes and at least once a year.
This is an operational record, not legal advice; the controller's counsel should confirm the open points at the end.

## Controller

Ahmed Mughram, private individual, Kingdom of Saudi Arabia, operating sqwer as a free, non-commercial project.
Contact: info@mughram.com. No Data Protection Officer is appointed: none is required, as there is no public authority,
no large-scale systematic monitoring and no special-category data (Art. 37 GDPR; LGPD small-scale agents,
ANPD Resolution 2/2022).

## Processing activities

| Activity | Purpose | Data subjects | Data | Legal basis | Recipients | Retention | Where in the code |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Accounts | Provide the account, sign-in and recovery | Registered users (16+) | Email, password hash (scrypt), recovery code hashes, acceptance and age confirmation times | Contract (6(1)(b)); accountability (6(1)(f), 5(2)) | Database and web hosts | Until deletion of the account | `routes/signup`, `signin`, `reset-password`, `lib/server/auth.ts` |
| Sessions | Keep users signed in; show their devices | Registered users | Session token hash, browser description, times | Contract | Hosts | 30 days idle, 90 days at most | `lib/server/auth.ts` |
| Profile and public profile | Personalise; optional public page and leaderboards | Registered users | Profile fields, optional picture (rights confirmation time) | Contract; leaderboards: legitimate interest (opt-out) | Hosts; the public for public fields | Until changed or deleted | `routes/account`, `routes/u`, `lib/server/progress.ts` |
| Practice data | Results, courses, finger map, usage statistics | Registered users | Typing results with keystroke timings, lesson progress, finger observations, usage counters | Contract; competitive checks: legitimate interest | Hosts | Until cleared by category or account deletion | `routes/api/*`, `lib/server/data.ts` |
| Security | Protect accounts and the service | Users and visitors | Security events (account), keyed hashes of IP addresses (logs), used-token hashes, in-memory rate-limit keys | Legitimate interest (Recital 49) | Hosts; Cloudflare where Turnstile is on | Account events: with the account; logs 14 days; tokens until expiry; memory at most one day | `lib/server/bot/*`, `security-log.ts`, `rate-limit.ts` |
| Visit analytics | Measure use of the site | Visitors who allow it | Page paths, visible time, referring host, UTM tags, device/browser/OS labels, random visitor and visit ids, account link if signed in | Consent (6(1)(a); ePrivacy 5(3)) | Hosts | 13 months, then daily totals without personal data | `lib/analytics/*`, `routes/api/analytics`, `lib/server/analytics/*` |
| Account and product events | Understand use, reliability, abuse | Users and visitors | Event type, time, minimal details, account link when signed in (no IP, user agent or visitor id) | Legitimate interest (opt-out by objection) | Hosts | 13 months | `lib/server/analytics/track.ts` |
| Data exports and requests | Rights requests | Registered users | All account data (download); correspondence | Legal obligation | None | Correspondence at most two years | `routes/account/export`, email |

No data is sold, used for advertising or profiling, or obtained from other sources. No automated decision has legal or
similarly significant effects (competitive plausibility checks affect only leaderboard placement, with human review on
request).

## Processors and transfers

| Processor | Role | Location | Transfer safeguard | Agreement status |
| --- | --- | --- | --- | --- |
| Supabase Pte. Ltd. (Singapore), on AWS EMEA | Database | EU (Ireland) | SCCs 2021/914 and UK Addendum in Supabase's DPA | **Accept Supabase's DPA (offered in the Supabase dashboard's legal documents) before launch** |
| Web host (not yet chosen; set `LEGAL.webHost` in `apps/web/src/lib/site/links.ts`) | Runs the server | To be chosen (Europe recommended) | Per provider | **Choose, accept its DPA, name it in the Privacy Policy before launch** |
| Cloudflare, Inc. (only if Turnstile is enabled) | Bot verification | Global; US | EU-US Data Privacy Framework and SCCs in Cloudflare's DPA | **Accept Cloudflare's DPA (Cloudflare dashboard) if Turnstile is used** |

## Security measures (Art. 32)

See `SECURITY_AUDIT.md`, `BOT_PROTECTION.md` and `DEPLOYMENT.md`: TLS everywhere, verified database TLS, scrypt
password hashing, hashed session and recovery tokens, row-level security with a restricted application role,
least-privilege migrations, rate limiting and bot protection, CSP and security headers, keyed IP hashes in logs,
encrypted backups recommended, breach procedure (Privacy Policy section 12; DEPLOYMENT.md incident response).

## DPIA screening (Art. 35)

Checked against the EDPB criteria (WP248 rev.01): evaluation or scoring; automated decisions with significant effect;
systematic monitoring; sensitive data; large scale; matching datasets; vulnerable subjects; innovative technology;
preventing exercise of a right.

| Criterion | Present? | Reason |
| --- | --- | --- |
| Evaluation or scoring | Limited | Typing speed and ranks about the user's own practice; no effect on access to services |
| Automated decision with significant effect | No | Plausibility checks affect leaderboard placement only; reviewable on request |
| Systematic monitoring | No | Analytics is first-party, opt-in, limited to this site, without cross-site tracking or fingerprinting |
| Sensitive or special-category data | No | None collected; keystroke timings are not used to identify people |
| Large scale | No | Small, non-commercial service |
| Matching or combining datasets | No | No external sources |
| Vulnerable subjects | No | Accounts limited to people aged 16 or older |
| Innovative technology | No | Conventional web application |
| Prevents exercise of a right or service | No | |

Result: fewer than two criteria met; a full DPIA is not required. Repeat this screening if analytics becomes
non-consent-based, keystroke data is used for identification, children are admitted, or the service grows to a large
scale.

## Open points for counsel

1. **EU and UK representatives (Art. 27 GDPR and UK GDPR).** The controller is outside the EU and UK and offers the
   service to people there. The exemption for occasional, low-risk processing may apply; counsel should confirm
   whether a representative must be designated.
2. **UK data protection fee.** Confirm whether the ICO fee applies to a non-UK, non-commercial controller.
3. **Saudi PDPL** obligations are being handled separately by the controller's counsel.
