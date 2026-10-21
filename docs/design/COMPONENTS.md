# sqwer components

Every Svelte component in `apps/web/src/lib`: what it is for, its props (names and defaults exactly as in the
source), its states, and where it is used. Visual rules are in [DESIGN_GUIDE.md](DESIGN_GUIDE.md); animation timings in
[MOTION.md](MOTION.md); keyboard behaviour in [INTERACTIONS.md](INTERACTIONS.md); placement on pages in
[UI_MAP.md](UI_MAP.md).

Conventions:
- Props are Svelte 5 `$props()`. `onx` props are callbacks. `$bindable` marks two-way props.
- "Lines" is the current size of the file, as a rough indication of complexity.
- Shared CSS classes (`.btn`, `.btn-primary`, `.btn-danger`, `.btn-lg`, `.link-arrow`, `.rise`, `[data-reveal]`) live
  in `app.css` and are described in DESIGN_GUIDE.md.

---

## 1. Site chrome (`lib/site`)

| Component | Lines | Props | Purpose and states |
|---|---|---|---|
| `SiteHeader` | 388 | none (reads `page.data.user`) | Sticky frosted header: wordmark or mark, `NAV_LINKS`, resume pill, `ThemeToggle`, `AccountMenu` or Sign in/Create account. States: top, scrolled (border and shadow), mobile menu open/closed (< 900px, Escape closes), active link. Excluded from page transitions. |
| `AccountMenu` | 379 | `user` | Avatar button with a level square; opens a menu panel with a level card (rank, XP bar), `ACCOUNT_LINKS`, public profile link and Sign out (opens `SignOutDialog`). Closes on Escape, outside click and navigation. |
| `SiteFooter` | 185 | none | Dark footer: brand line, `FOOTER_GROUPS` (Learn, Account, Help, Legal), copyright with operator name, "Analytics preferences" button. |
| `Breadcrumbs` | 66 | `items` | Trail of `{ href, label }`, last item current; emits BreadcrumbList JSON-LD. Used by `Prose`, history detail. |
| `Prose` | 425 | `kicker, title, lede, updated, crumbs, doc, toc, children` | Long-form document layout for help and legal pages: breadcrumbs, heading block, "Last updated", document meta (`doc`), table of contents (`toc`, sticky on wide screens), body typography, related documents. |
| `Seo` | 44 | `title, description, noindex = false, jsonLd` | Sets `<title>` ("title · sqwer"), description, Open Graph, canonical, robots and JSON-LD. |
| `SignOutDialog` | 22 | `open, onclose` | Confirm dialog "Sign out of sqwer?" posting to `/signout`; pending state on submit. |

Data modules: `links.ts` (contact address, operator details, nav, account and footer links), `legal.ts` (legal page
metadata).

## 2. Brand (`lib/brand`)

| Component | Props | Purpose |
|---|---|---|
| `LogoMark` | `class: className = ''` | The square mark, inline SVG in `currentColor`. Favicon source. |
| `LogoWordmark` | `class: className = ''` | Mark plus "sqwer" wordmark, inline SVG in `currentColor`. |

## 3. General UI (`lib/ui`)

| Component | Lines | Props | Purpose and states |
|---|---|---|---|
| `Icon` | 65 | `name, size = 18, class: className = ''` | The 37-icon set (stroke 1.8, round caps), `aria-hidden`. Names listed in DESIGN_GUIDE.md. |
| `ThemeToggle` | 79 | none | Three-option radio group System / Light / Dark with icons; arrow keys move between options; writes `settings.theme`. |
| `Dialog` | 118 | `open, title, children, actions, onclose, alert = false` | Native `<dialog>` modal: title, body, actions row; Escape and backdrop close (not for `alert`); focus returns to the opener; `role="alertdialog"` when `alert`. |
| `ConfirmForm` | 63 | `action, title, message, trigger, triggerClass = 'btn', triggerLabel, confirmLabel, pendingLabel = 'Please wait…', danger = false, fields` | A button that opens a `Dialog` containing a form posted to `action`; optional extra `fields` (for example a password); danger styling; pending label while submitting. |
| `Field` | 224 | `label, name, hint, error = null, value = $bindable(''), multiline = false, rows = 3, strength = false, matches, id, ...rest` | Labelled input or textarea with hint, inline error (`aria-describedby`, `aria-invalid`), asterisk when `required`, password reveal button, optional strength meter (4 bars) and "matches" check against another field. |
| `RequiredNote` | 2 | none | The line "Fields marked * are required." (asterisk drawn by `.req`, announced as "with an asterisk") placed above forms with required fields. |
| `HumanCheck` | 92 | `check, result = null, error = null, resetKey` | Chooses the human verification for a form from the server's `check`: none, the built-in `Captcha`, or `Turnstile`. |
| `Captcha` | 367 | `error = null, resetKey, action, fallback = false` | Built-in verification: a proof-of-work check runs in the background while the person types the characters shown (or answers a text question with `fallback`); status line and dot (idle, working, verified, failed); each challenge is single use; resets when `resetKey` changes. |
| `Turnstile` | 96 | `siteKey, action, resetKey, onfail` | Cloudflare Turnstile widget wrapper (only when configured); calls `onfail` to fall back to `Captcha`. |
| `CountUp` | 15 | `value, format = (n) => String(Math.round(n)), duration = 900` | Animated number from 0 using Svelte `Tween` (cubic-out); instant with reduced motion. |
| `Confetti` | 81 | `pieces = 140, duration = 2600` | Full-screen canvas burst; see MOTION.md section 8. |

Helpers in the same folder: `reveal.ts` (`use:reveal`), `transition.ts` (`swap`), `typing-focus.ts` (`claimTyping`,
`releaseFocus`, `installKeyboardGuards`), `autofocus.ts`, `formSignals.ts` (form timing signals for bot checks).

## 4. Account (`lib/account`)

| Component | Lines | Props | Purpose and states |
|---|---|---|---|
| `AuthShell` | 238 | `title, lede, mode = 'signin', children, footer` | Split layout for sign in, sign up and reset: form column and brand column; single column on phones. |
| `RecoveryCodes` | 97 | `codes, email` | Shows the 8 recovery codes once after sign up, with copy and download (`sqwer-recovery-codes.txt`), and a confirmation to continue. |
| `Avatar` | 35 | `name, color, size = 48, src = null` | Square avatar (3px radius): the uploaded image, otherwise initials on the chosen palette colour. |
| `AvatarUpload` | 162 | `name, color, src, error = null` | File picker with preview, remove, size and type limits, and a required checkbox confirming the person holds the rights to the image. |
| `ProfileForm` | 573 | `mode, initial, errors = {}, submitLabel, action, avatar = null` | Four-step profile form: About you, Experience, Keyboard, Look (banner and colour). `mode` is setup (first run, stepped) or edit. Live preview through `ProfileCard`. |
| `ProfileCard` | 198 | `name, username, headline = '', pronouns = '', bio = '', avatarColor, avatar = null, banner, rank = null, stats = [], level = 2, size = 'full', children` | Public profile card: banner, avatar, name, pronouns, headline, bio, rank, stats. `size` full or compact. |
| `SettingsSection` | 75 | `title, description, danger = false, id, aside, children` | Settings block: heading and description on the left, controls on the right; danger variant with a red rule. |

## 5. Learning path (`lib/courses`)

| Component | Lines | Props | Purpose and states |
|---|---|---|---|
| `LessonPlayer` | 576 | `lesson` | Runs a lesson: header, step track, progress, pace, the current step, outcome panel, `LessonComplete`, leave dialog. States in UI_MAP.md 3.5. |
| `LessonComplete` | 224 | `lesson, next, result, onrepeat` | End of lesson: confetti, stars, XP, rank-up badge, rank progress, next/repeat actions. |
| `PlacementStart` | 121 | `chapter, large = false, centred = false, children` | Card that explains placement and starts it, or starts at `chapter`. |
| `RankBadge` | 75 | `rank, size = 56, locked = false` | Course rank badge (Novice to Legend) with its material colours; greyed when `locked`. |
| `Stars` | 39 | `stars, size = 18, pop = false` | Three stars, filled up to `stars`; `pop` animates them in. |

### 5.1 Steps (`lib/courses/steps`)

Every step reports a `StepResult` through `oncomplete` (passed, accuracy, speed, graded).

| Component | Lines | Props | Purpose |
|---|---|---|---|
| `GameFrame` | 382 | `title, icon, how, goal, progress, status, lives = null, over = null, paused = false, onstart, onpause, onresume, height = 360, preview = 0, previewLabel = 'Get ready', children` | Shared frame for games: title bar with icon, how-to and goal, ready overlay (Space or Enter to start), optional reading preview with a draining bar, 3-2-1 count-in, lives, progress bar, paused overlay (auto-pause when the tab is hidden), end overlay. |
| `KeyIntro` | 204 | `keys, tip, oncomplete` | Introduces new keys: a large bobbing key cap, the finger on `Hands`, press each key a set number of times (dots fill); wrong key named. |
| `TypingDrill` | 273 | `tokens, seconds, minAccuracy, minWpm = 0, hints = $bindable(true), oncomplete` | Timed drill over given tokens with a meter, hints toggle (keyboard and finger), accuracy and speed goals. |
| `KeyHunt` | 224 | `pool, focus, target, pace = 1, oncomplete` | A key lights on the keyboard; press it before the fuse runs out; 3 lives. |
| `Echo` | 328 | `pool, start, target, showMs = 1100, words, oncomplete` | Letters of a word light up one at a time and fade; type the word from memory; optional tones. |
| `FallingGame` | 439 | `items, pool, focus, words, target, pace: tempo = 1, oncomplete` | Letters or words fall; type each before it lands; lands cost a life. |
| `Race` | 298 | `pool, focus, words, sentences, count, pacerWpm, oncomplete` | Read a passage, then type it before the pacer reaches the line. |
| `ListenType` | 330 | `pool, focus, words, count, target, oncomplete` | Hear a word (device speech voice), type it; answer feedback. |

Data and logic: `catalog.ts` (`PARTS`, chapters, lessons), `stepInfo.ts` (`STEP_INFO` names, icons, how-to),
`progression.ts` (`RANKS`, XP), `pace.svelte.ts` (adaptive pace), `store.svelte.ts` (level, start, pending lesson),
`audio.ts` (tones).

## 6. Typing test and results (`lib/test`, `lib/results`)

| Component | Lines | Props | Purpose and states |
|---|---|---|---|
| `TypingTest` | 697 | `exam = null` | The test: config bar or exam banner, counter, `Words`, restart, `Keyboard`, tools, legend; then `ResultReport` or `RankedResult`. Hidden input captures keys (and `beforeinput` on mobile). |
| `ConfigBar` | 139 | `onchange` | Mode (Time/Words), length options, punctuation, numbers; saves settings and restarts. |
| `Words` | 190 | `session, rev, idle` | Renders the text window (three lines), letter states, caret position and line scrolling. |
| `ResultReport` | 422 | `record, onnext, onrepeat` | Result: WPM and accuracy (count-up), XP badge, details (raw, consistency, characters, time), `ResultChart`, `WordHeatmap`, `ResultReplay`, guidance, actions. |
| `ResultChart` | 377 | `timeline, previous = null` | SVG chart of speed over time (WPM and raw) with error markers and optional previous-run line; pointer and arrow-key crosshair with tooltip. |
| `ResultReplay` | 158 | `detail, seconds` | Replays the keystrokes with play/pause, 1×/2×/4× and a scrubber; flashes keys on a keyboard. |
| `WordHeatmap` | 123 | `words` | The text with each word tinted by speed (heat tokens), fastest and slowest words named. |

## 7. Practice, games, competitive

| Component | Lines | Props | Purpose |
|---|---|---|---|
| `ExamVisual` (`lib/exams`) | 306 | `exam` | Small illustration per exam card: placement arc, keys, bars or key fills. |
| `EndlessGame` (`lib/games`) | 571 | `game` | Setup (difficulty), rounds through the step components, level changes, strikes, best run. |
| `RankEmblem` (`lib/competitive`) | 257 | `league, size = 96, locked = false` | Competitive rank emblem in the league colours with twinkling sparkles; greyed when `locked`. |
| `RankedResult` (`lib/competitive`) | 371 | `record, previousBest, upload, onnext, onrepeat` | Ranked result: server check spinner, accepted or rejected (with the reason), emblem, rank-up, progress to the next rank, figures. |

## 8. Fingers and keyboard

| Component | Lines | Props | Purpose |
|---|---|---|---|
| `Keyboard` (`lib/keyboard`) | 215 | `layout, pressed = new Set(), okKey = null, errorKey = null, highlight, showZones = false, zoneMap, pendingKeys, onkeyselect, selectedKey = null, class: className = '', label = 'Keyboard'` | SVG keyboard for ANSI Mac/PC: pressed, correct and error flashes, highlighted next key, finger zones, pending keys, optional key selection (Enter/Space on a focused key). |
| `Hands` (`lib/hands`) | 252 | `label, tone, active = null, legend, onselect, fingerName = fingerLabel, disabled = false, pointerOnly = false, legendSize = 10, animate = false` | Two illustrated hands with ten fingers in finger colours; highlights `active`; optional legend with leader lines; selectable fingers (`onselect`); entrance animation. |
| `FingerChips` (`lib/fingermap`) | 114 | `disabled = false, suggested = null, onpick` | Ten finger buttons labelled 1 to 0, the suggestion marked. |
| `MapOverview` (`lib/fingermap`) | 801 | none | Finger map overview page body (coverage, comparison, import/export, reset). |
| `MapSession` (`lib/fingermap`) | 443 | none | Mapping session (type, pick finger, Shift question). |
| `FingerMapSync` (`lib/fingermap`) | 23 | none | Invisible: syncs the local finger map with the account. |
| `FingerAssessment` (`lib/assessment`) | 427 | none | Finger speed assessment flow. |
| `FingerScores` (`lib/assessment`) | 182 | `fingers` | Per-finger speed and accuracy bars. |
| `MapPreview` (`lib/landing`) | 67 | none | Home page keyboard coloured by finger. |

## 9. Admin and analytics

| Component | Lines | Props | Purpose |
|---|---|---|---|
| `PeriodControls` (`lib/admin`) | 231 | `period, filters, routes = [], extra, hidden = {}` | Period presets (7 days, 30 days, 90 days, 12 months, custom) and filters as a GET form. |
| `TrendChart` (`lib/admin`) | 255 | `days, series, title, unit = ''` | Line chart per day; arrow keys move the crosshair. |
| `DailyBars` (`lib/admin`) | 212 | `days, series, title` | Stacked daily bars; arrow keys move the selection. |
| `BarList` (`lib/admin`) | 145 | `title, items, measure, extraLabel, label = (k) => k, href, empty = 'Nothing recorded in this period.'` | Ranked horizontal bars with counts and optional links. |
| `Analytics` (`lib/analytics`) | 106 | none | Consent banner and, after consent, page-view collection. |
| `ActivityTracker` (`lib/usage`) | 47 | none | Invisible: counts active time while signed in. |

---

## 10. Known component issues for the rebuild

- `MapOverview` defines local `btn primary` / `btn danger` classes instead of the shared `.btn-primary` / `.btn-danger`.
- Em dashes appear in `ResultReport` (fastest and slowest word), `FingerScores` (accuracy) and account statistics as
  "no value" placeholders; replace them with words ("None", "Not enough data").
- `MapOverview` (801 lines), `TypingTest` (697) and `LessonPlayer` (576) mix page layout, state and logic; split them
  into a state module and presentational parts when rebuilding.
- Several components draw their own small charts (`ResultChart`, `TrendChart`, `DailyBars`, `FingerScores`); a single
  chart foundation would remove duplicated crosshair and tooltip code.
