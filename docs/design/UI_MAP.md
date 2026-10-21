# sqwer UI map

The complete map of the current interface: every route, what is on it, in what order, which components build it and
which states it has. Use it as the checklist when rebuilding the frontend with other libraries: a rebuilt page is done
when every row for it here is accounted for.

| Document | Covers |
|---|---|
| [DESIGN_GUIDE.md](DESIGN_GUIDE.md) | Tokens, colour, type, layout, shape, icons, buttons, forms, voice |
| **UI_MAP.md** (this file) | Sitemap, global shell, page-by-page structure and states |
| [COMPONENTS.md](COMPONENTS.md) | Every component: purpose, props, states, where it is used |
| [MOTION.md](MOTION.md) | Every animation and transition with exact timings |
| [INTERACTIONS.md](INTERACTIONS.md) | Keyboard model, shortcuts, game rules, storage, loading/empty/error states |

Source paths are relative to `apps/web/src/`.

---

## 1. Sitemap

```
/                                Home
/start                           Get started (level, then suggested path)
/learn                           Learning path (course ranks, chapters, lessons)
  /learn/start                   Placement and chapter picker
  /learn/[lesson]                Lesson player (first lesson open, others need an account)
/exams                           Practice (exam cards by category, endless games)
  /exams/finger-speed            Finger speed assessment
/test?exam=<id>                  Typing test, exam run or ranked run
/play/[game]                     Endless game (race, falling-words, falling-letters, echo, listen, keyhunt)
/map                             Finger map overview
  /map/session                   Finger mapping session
/history                         Test history
  /history/[id]                  One saved result
/competitive                     Ranked arena, ranks and leaderboard
/u/[username]                    Public profile

/signin   /signup   /reset-password   (/signout is a POST endpoint)
/account                         Overview            [sign-in required]
  /account/profile               Profile editor      [sign-in required]
  /account/setup                 First-run profile   [sign-in required]
  /account/statistics            Statistics          [sign-in required]
  /account/security              Password, sessions, recovery codes [sign-in required]
  /account/data                  Export and deletion [sign-in required]

/about  /faq  /accessibility
/legal  /terms  /privacy  /cookies  /copyright  /security

/admin                           Redirects into admin   [admin + TOTP]
  /admin/2fa  /admin/2fa/setup   Second factor
  /admin/analytics               Dashboard
  /admin/analytics/events        Event log
  /admin/users                   Users and suspension

+error.svelte                    Error page (404 and 500) with a reference code
```

Server-only endpoints that the UI calls (not pages): `/account/export` (download), `/admin/analytics/export`,
analytics collection, result upload, avatar upload.

### Navigation model

| Place | Contents | Source |
|---|---|---|
| Header nav | Learning path `/learn` (icon route), Practice `/exams` (icon gauge), Competitive `/competitive` (icon trophy) | `lib/site/links.ts` `NAV_LINKS` |
| Account menu | Overview, Profile, Statistics, Security, Your data, plus Sign out | `ACCOUNT_LINKS` |
| Footer | The complete site map in four groups: Learn, Account, Help, Legal; plus "Analytics preferences" | `FOOTER_GROUPS` |
| In-page | Each page links only to what the reader needs next (for example Practice links to Finger map and History) | |

Finger map and History have no header entry; they belong to Practice. Get started is reached from Home and the
Learning path.

---

## 2. Global shell (`routes/+layout.svelte`)

Order from top to bottom:

1. **Skip link** "Skip to content", off screen until focused, then at the top left.
2. **Site header** (`SiteHeader`), sticky, frosted (background at about 85% with backdrop blur), shown on every page.
   - Left: the wordmark (`LogoWordmark`). Below 520px the logo mark (`LogoMark`) is shown instead. It links home.
   - Centre: the three nav links with icons. The active link is marked (`aria-current="page"`) by a stronger ink and a
     lime indicator.
   - Resume pill (when a course is in progress): "Continue" with the next lesson, linking to it.
   - Right: `ThemeToggle` (System, Light, Dark), then either `AccountMenu` (signed in) or "Sign in" (text button) and
     "Create account" (primary button).
   - Under 900px the nav collapses into a menu button. The panel drops below the bar with the nav links (staggered),
     the theme and the account links. Escape closes it and returns focus to the button.
   - After 8px of scroll the bar gains a hairline border and soft shadow.
3. **Main** (`<main id="content">`), a column of at most 1180px with responsive side gutters (16px on phones).
4. **Site footer** (`SiteFooter`), always dark (fixed dark band in both themes): brand line, the four link groups,
   copyright line with the operator name, and the "Analytics preferences" button that reopens the consent banner.
5. **Consent banner** (`lib/analytics/Analytics.svelte`), bottom left, only until the visitor answers. Text, "Allow"
   and "Refuse" with equal weight, and a link to the Cookies page.
6. Invisible helpers: `ActivityTracker` (usage time while signed in), `FingerMapSync`, keyboard guards
   (`installKeyboardGuards`) and the page transition hook.

Per-page `<head>` is set through `Seo` (title "Page · sqwer", description, `noindex` for private pages, JSON-LD on
public ones).

---

## 3. Pages

Each entry: **purpose**, **sections in order**, **components**, **states**.

### 3.1 Home `/`

Purpose: explain the product in one pass and send people to Get started or a test.

1. **Hero**: dotted grid background, the headline in the display serif, a short lede, primary CTA "Get started" and
   secondary "Take a typing test", a row of three facts. To the right, `Hands` with `animate` (fingers fade in,
   leader lines draw, legend values pop).
2. **Course road**: a vertical timeline of the course parts (from `lib/courses/catalog.ts` `PARTS`), alternating
   milestones that reveal on scroll, each a card with part name, chapter count and a short line.
3. **Games band** (dark band): six live previews, one per game (Falling letters, Falling words, Listen and type, Key
   hunt, Race, Echo), each a looping CSS animation in a card with title and one line; cards link to `/play/[game]`.
4. **Rank ladder**: the course ranks Novice to Legend (`RankBadge` for each) on a stepped line.
5. **Technique split**: copy on the left, `MapPreview` (a small keyboard coloured by finger) on the right, linking
   to `/map`.
6. **Principles**: short statements (privacy, no ads, free) in a plain grid.

States: static. All decorative loops stop with reduced motion.

### 3.2 Get started `/start`

Two steps on one page, swapped in place.

1. **Your level**: four option cards (from "I am new to typing" to "I touch type"), each with a small `Hands`
   illustration, a title and a line. Choosing one stores `sqwer:level`.
2. **Your path**: the recommended start (placement or a chapter), with `PlacementStart`, a primary "Start" and a
   secondary to see all chapters. A "Back" link returns to step 1.

States: first visit; returning visitor (the saved level preselected).

### 3.3 Learning path `/learn`

1. **Header**: signed in, the current course rank (`RankBadge`), XP, and a progress bar to the next rank. Signed
   out, a title, lede and three facts.
2. **Up next card**: the next lesson with its chapter, steps count, stars so far, and "Continue" (primary). The tile
   of the next lesson "beckons" (pulsing lime ring).
3. **Ways to start**: three cards: Placement (`/learn/start`), Start from the beginning, Choose a chapter.
4. **Chapter explorer**: parts as groups; each chapter a card with name, progress bar, lesson count and stars. Selecting
   a chapter opens its **detail** panel (re-animated on change): description, and lesson rows with number, title,
   step icons, stars (`Stars`), and a lock for lessons that need an account.

States: signed out; signed in with no progress; in progress; course finished. Lessons after the first show a lock when
signed out.

### 3.4 Placement `/learn/start`

`PlacementStart` (large, centred) explaining the short placement exercise, with "Start placement". Below, the chapter
list with a "Start here" action on each, so a learner can skip the placement.

### 3.5 Lesson `/learn/[lesson]`

Signed out and not the first lesson: a **sign-up gate** with the lesson name, a short reason and "Create a free
account" (primary, large) and "Sign in".

Otherwise `LessonPlayer`:

1. **Lesson header**: back link "Learning path", lesson title, chapter, and "Leave" (opens a confirm dialog when
   progress would be lost).
2. **Step track**: one dot per step, current one filled lime, done ones solid.
3. **Lesson progress bar** and the adaptive **pace** indicator.
4. **Step**: one of `KeyIntro`, `TypingDrill`, `KeyHunt`, `Echo`, `FallingGame`, `Race`, `ListenType`; games are
   wrapped in `GameFrame`.
5. **Outcome panel** after each step: passed (badge pops) or not passed, the figures, guidance, "Next" (Enter) and
   "Try again".
6. **Lesson complete** (`LessonComplete`): confetti, stars (`Stars` with pop), XP gained, rank-up badge when a new
   course rank is reached, progress to the next rank, "Next lesson", "Repeat lesson", "Learning path".

States: each step (ready, playing, paused, over), outcome passed or failed, complete, rank up, leave confirmation,
first lesson without an account (result stored in `sqwer:pending-lesson`, saved after sign-up).

### 3.6 Practice `/exams`

1. Title and lede, with links to Finger map and History.
2. **Exam categories** (from `lib/exams.ts`: 8 exams in 4 categories). Each category has a heading and a grid of
   **exam cards**: an `ExamVisual` (placement arc, keys, bars or key fills), title, one line, duration or length,
   XP note and a "go" arrow. Cards link to `/test?exam=<id>` (or `/exams/finger-speed`).
3. **Endless games** list: six rows with icon, title, summary, best run, and an arrow; rows link to `/play/[game]`.

### 3.7 Typing test `/test`

`TypingTest` (with an optional `exam`).

- **Free test** (no exam): `ConfigBar` (Time or Words; 15/30/60/120 s or 10/25/50/100 words; punctuation; numbers).
- **Exam or ranked**: an exam banner with the exam name and rules instead of the config bar; ranked shows the
  readout toggles (time, speed).

Layout in order:
1. Config bar or banner (part of the fading "chrome").
2. Live counter (time left or words typed) and, when enabled, live WPM.
3. **Words** (`Words`): three visible lines of monospace text, lime caret, correct/incorrect/extra colouring.
4. Restart button (Tab), shown below the text.
5. **On-screen keyboard** (`Keyboard`) with the next key highlighted, optional finger zones, and **tools** (show
   keyboard, finger zones, platform Mac/PC).
6. **Legend** for finger colours when zones are on.

Then, in place of the test (view transition):
- **Free test or exam**: `ResultReport` (figures with count-up, XP badge, details, `ResultChart`, `WordHeatmap`,
  `ResultReplay`, guidance, "Next test", "Repeat", Tab hint).
- **Ranked**: `RankedResult` (server check, accepted or rejected, rank emblem, rank-up, progress to next rank).

States: idle (caret blinking), typing (chrome faded), finished, saving, saved, offline/failed save, mobile virtual
keyboard input, ranked rejected by the anti-cheat check.

### 3.8 History `/history` and `/history/[id]`

- List: a summary (completed tests, not completed, time typing, best speed, average of the last 10 with accuracy),
  filters (examination; status completed or not completed) with a result count, and the results list linking to
  each record, with "Show more" paging.
- Detail: the stored result rendered with `ResultReport` without the next/repeat actions; breadcrumbs back to
  History.

States: loading ("Loading your results…"), empty ("No results yet" with "Browse examinations"), filtered empty,
results that include abandoned attempts.

### 3.9 Endless game `/play/[game]`

`EndlessGame`:
1. **Setup**: game title and summary, difficulty choice (Adaptive, Gentle, Steady, Brisk, Fast, Expert with notes),
   best run, and "Start".
2. **Round**: the game inside `GameFrame` with a HUD: level, round, strikes left (3), score.
3. **Round result**: cleared or failed, level change, best run, "Next round" or "Try again", "Change difficulty".

### 3.10 Finger speed `/exams/finger-speed`

`FingerAssessment`: introduction, a sequence of timed rounds per finger with a break between rounds (Enter
continues), then `FingerScores` (bars per finger for speed and accuracy, with the strongest and weakest named).

### 3.11 Finger map `/map` and `/map/session`

- **Overview** (`MapOverview`): coverage keyboard (`Keyboard` with zones), per-finger summary, comparison with standard
  touch typing, "Start mapping", "Continue", import and export of the profile file, reset (danger).
- **Session** (`MapSession`): prompt text, `Hands` and `FingerChips` to pick a finger after each key (1 to 0 or
  click), the Shift question, coverage bar, notices for wrong keys, Escape to finish.

### 3.12 Competitive `/competitive`

1. **Arena** (dark band): "Ranked" with a live dot, your rank (`RankEmblem`, floating) or how to enter, your best,
   progress to the next rank, and "Play ranked" (to `/test?exam=competitive`, or to sign in first).
2. **Rank rail**: eleven ranks as tabs with emblems; selecting one shows its speed range and description.
3. **Leaderboard**: a podium for the top three, then rows with position, avatar, name (links to `/u/[username]`), rank
   and best WPM.

States: signed out; signed in without a rank; ranked; empty leaderboard.

### 3.13 Authentication `/signin`, `/signup`, `/reset-password`

All inside `AuthShell` (split layout: form panel and a brand panel; single column on phones).

- **Sign in**: email, password (`Field` with reveal), "Forgot password", `HumanCheck` when required, submit, link to
  sign up.
- **Sign up**: email, password with strength meter, confirm password (match check), two required checkboxes (accept
  the Terms and Privacy notice; confirm age), `HumanCheck`, submit. After success, `RecoveryCodes` (shown once, copy and download), then continue to `/account/setup`.
- **Reset password**: email, a recovery code (format ABCD-EFGH-JKMN), new password and confirmation. Resetting signs
  out every other device.

Required fields carry an asterisk with `RequiredNote` above the form. Errors are inline per field and a summary at
the top.

### 3.14 Account (`routes/account/+layout.svelte`)

Layout: an **identity header** (avatar, name, username, rank) and a **side nav** (`ACCOUNT_LINKS`) that becomes a
horizontal scroller on phones.

| Page | Contents |
|---|---|
| Overview | Setup steps checklist, recent results, course progress, links to each area |
| Profile | `SettingsSection` blocks: `AvatarUpload` (upload, remove, colour fallback), `ProfileForm` (4 steps: About you, Experience, Keyboard, Look) with a live `ProfileCard` preview |
| Setup | The same `ProfileForm` in first-run mode with a step indicator |
| Statistics | Sections Time (active days), Tests (by examination), Typing, Words, and Manage statistics (clear) |
| Security | Change password (current, new, confirm); recovery codes meter "N of 8 unused" and "Generate new recovery codes" (password required); Signed-in devices with "Sign out" per device (`ConfirmForm`) |
| Your data | Download a copy (JSON), clear stored data (password required), delete the account (password and typing DELETE, danger) |

### 3.15 Public profile `/u/[username]`

`ProfileCard` (banner, avatar, name, pronouns, headline, bio, rank, stats) and panels for recent results and
achievements. 404 for unknown or private profiles.

### 3.16 Help and legal

- `/about` (How it works), `/faq` (17 questions as `<details>`), `/accessibility`.
- `/legal` (index), `/terms`, `/privacy`, `/cookies` (with the storage table), `/copyright`, `/security`.
- All use `Prose`: breadcrumbs, kicker, title, lede, "Last updated", a document meta block, a table of contents
  (sticky on wide screens), the body, and related documents at the end.

### 3.17 Admin

Admin pages require an admin account and a second factor.

- `/admin/2fa/setup`: QR code and secret for an authenticator app, then a code to confirm, then recovery codes.
- `/admin/2fa`: enter the six-digit code.
- `/admin/analytics`: `PeriodControls` (7 days, 30 days, 90 days, 12 months, custom; filters), headline figures, `TrendChart`, `DailyBars`,
  several `BarList` panels (pages, referrers, devices, countries), export.
- `/admin/analytics/events`: a filterable table of events.
- `/admin/users`: search, user rows with status, suspend or restore with a reason (`ConfirmForm`).

### 3.18 Error page (`routes/+error.svelte`)

Status code, a plain title ("This page could not be found." or "Something went wrong."), a line of help, a reference code for server
errors (to quote when reporting), and links home and back.

---

## 4. Responsive behaviour (summary)

| Width | Change |
|---|---|
| < 520px | Logo mark replaces the wordmark; buttons stretch to full width in forms |
| < 640px | Single-column cards; tables scroll horizontally inside their panel |
| < 900px | Header nav moves into the menu panel; two-column layouts (hero, technique, auth) stack |
| < 1024px | Account side nav becomes a horizontal scroller; legal TOC moves above the body |
| ≥ 1180px | Content column stops growing |

The full list of breakpoints in use (15) and a proposed set of five is in DESIGN_GUIDE.md, section Layout.
