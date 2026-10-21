# sqwer design guide

The visual language of sqwer, captured from the current implementation (SvelteKit, Tailwind v4 plus scoped CSS) so it can be
rebuilt with any library without redesigning it. Values here are the source of truth; where the code disagrees, it is listed
under [Known inconsistencies](#known-inconsistencies).

Related documents: [UI_MAP.md](UI_MAP.md) (pages), [COMPONENTS.md](COMPONENTS.md), [MOTION.md](MOTION.md),
[INTERACTIONS.md](INTERACTIONS.md).

Source files: `apps/web/src/app.css` (tokens, base, shared classes, motion), `apps/web/src/app.html` (theme bootstrap),
`apps/web/src/lib/profile.ts` (avatar and banner palettes), `apps/web/src/lib/courses/RankBadge.svelte` and
`apps/web/src/lib/competitive/*` (rank materials).

---

## 1. Principles

1. **Warm, calm, precise.** A cream paper background in light mode, true black in dark mode, one electric accent.
2. **One accent with one job.** Lime `#CCF900` marks the single most important action, the caret, the current item and
   selection. Never body text on a light background.
3. **Supporting colours each have one job** (see 2.4) and are used sparingly beside the accent.
4. **Square-ish geometry.** Every radius is **3px** (buttons, cards, inputs, dialogs, avatars, bars). Only the circular
   bits of illustrations are round.
5. **Emphasis by weight, never by decoration.** No underlines on links, no highlight blocks behind words. Links and emphasis
   use font weight (600 or 800) and colour.
6. **Quiet chrome, loud content.** While typing, everything except the text fades away.
7. **Every figure is explained.** Numbers carry labels, units and definitions.
8. **Accessible by default.** AA contrast, visible focus, full keyboard use, reduced motion respected.

---

## 2. Colour

### 2.1 Theme model

- Three preferences: **Light** (default), **Dark**, **System**. Stored in `localStorage['sqwer:theme']` as `light`, `dark` or
  `system`.
- An inline script in `<head>` applies `data-theme="light|dark"` on `<html>` before first paint (no flash). `system` leaves the
  attribute off and follows `prefers-color-scheme`.
- `<meta name="theme-color">`: `#FBFAF4` light, `#000000` dark.
- Dark values apply under `[data-theme='dark']` and under `prefers-color-scheme: dark` when the theme is not forced light.

### 2.2 Core tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--accent` | `#CCF900` | `#CCF900` | Primary action, caret, current item, selection, focus halo |
| `--on-accent` | `#111111` | `#111111` | Text and icons on the accent |
| `--bg` | `#FBFAF4` | `#000000` | Page background, inputs, dialogs, popovers |
| `--surface` | `#F4F2E8` | `#0E0E0E` | Cards, panels, secondary buttons |
| `--surface-2` | `#EBE8DB` | `#171717` | Hover on surface, tracks of progress bars |
| `--line` | `#DEDAC9` | `#242424` | Hairlines, card borders |
| `--line-strong` | `#C9C4B0` | `#333333` | Inputs, buttons, popovers |
| `--ink` | `#141414` | `#F2F2EE` | Primary text |
| `--ink-2` | `#55534B` | `#A8A8A1` | Secondary text, labels |
| `--ink-3` | `#6B685E` | `#9A9A93` | Tertiary text (only on `--bg`; fails AA on `--surface` at small sizes) |
| `--untyped` | `#8F8B7E` | `#6E6E68` | Text not yet typed in the typing area |
| `--error` | `#D1242F` | `#FF5C5C` | Errors, wrong keystrokes, danger buttons |
| `--error-soft` | `#FBE1E2` | `#3D1214` | Error backgrounds, missed characters |

### 2.3 Keyboard tokens

| Token | Light | Dark |
|---|---|---|
| `--key` | `#FFFEFA` | `#121212` |
| `--key-edge` | `#D6D1BD` | `#2C2C2C` |
| `--key-label` | `#4A4840` | `#B5B5AE` |
| `--key-pressed` | `#E6E2D2` | `#222222` |

Key states (`lib/keyboard/Keyboard.svelte`): idle `--key`; pressed `--key-pressed`; highlight and correct `--accent` with
`--on-accent` label; error `--error` with white label. Pressed, correct and error keys sink 1.5px.

### 2.4 Supporting colours (one job each)

| Token | Light | Dark | Soft light | Soft dark | Job |
|---|---|---|---|---|---|
| `--blue` | `#2160BD` | `#5B9CF0` | `#E4EEFB` | `#0F1D33` | Information, speed |
| `--green` | `#0D7550` | `#2FC48A` | `#DFF3E9` | `#0B2419` | Success, accuracy |
| `--amber` | `#946200` | `#F2BB3B` | `#FBF0D3` | `#2A2008` | Stars, rewards, first place |
| `--orange` | `#BD4211` | `#F07A45` | `#FDE6DC` | `#2C140A` | Streaks, energy |
| `--violet` | `#5A46D0` | `#9A8CF2` | `#EBE8FB` | `#1A1633` | Ranks, levels, progress |
| `--rose` | `#B3306A` | `#EC6F9F` | `#FBE3EC` | `#2C0F1B` | Highlights |

Course parts use these as their colour: Letters `green`, Capitals/marks/numbers `blue`, Words and flow `violet`, Speed and
mastery `orange`.

### 2.5 Finger colours (validated colourblind-safe)

| Token | Light | Dark | Finger |
|---|---|---|---|
| `--f-pinky` | `#6250D6` | `#9085E9` | Little finger |
| `--f-ring` | `#1BAF7A` | `#199E70` | Ring finger |
| `--f-middle` | `#EB6834` | `#D95926` | Middle finger |
| `--f-index` | `#2A78D6` | `#3987E5` | Index finger |
| `--f-thumb` | `#E87BA4` | `#D55181` | Thumb |

Used on the keyboard (zones, 12% to 42% fill plus a 3px underline bar), the hands illustration, finger chips and scores.

### 2.6 Data visualisation

| Token | Light | Dark | Series |
|---|---|---|---|
| `--chart-wpm` | `#2A78D6` | `#3987E5` | WPM (and the admin dashboard's first series) |
| `--chart-raw` | `#EB6834` | `#D95926` | Raw speed (second series) |
| `--chart-acc` | `#1BAF7A` | `#199E70` | Accuracy (third series) |
| `--chart-prev` | `#8F8B7E` | `#8A8A84` | Previous attempt |
| `--chart-grid` | `#E4E0D2` | `#222222` | Gridlines |

Word speed heatmap, slower to faster: `--heat-1..5` light `#E3EDFB #B7D0F4 #7FABE8 #3F7FD6 #1D4F9C`, dark
`#14213A #1D3A68 #275AA2 #4A86D9 #9CC3F3`; label ink switches with `--heat-ink-light` / `--heat-ink-dark`.

Chart rules: one axis per chart, a legend for two or more series, hover crosshair and tooltip, a table view where the data
matters, gaps (never zeros) for days without data.

### 2.7 Fixed dark bands

The footer, the home page "games" band, and the competitive page's arena and ranks bands are dark in **both** themes:
backgrounds `#070707`, `#0B0B0B`, `#121212`, `#161616`; text `#F2F2EE`, secondary `#B9B9B3`, `#A3A39C`, `#8E8E88`; lime and
violet (`#7A52E0`, `#9A8CF2`) glows as radial gradients.

### 2.8 Avatar and banner palettes (`lib/profile.ts`)

Avatar colours: Lime (`--accent` on `--on-accent`), Violet (`--f-pinky`), Green (`--f-ring`), Orange (`--f-middle`), Blue
(`--f-index`), Graphite (`--ink` on `--bg`); white initials on the coloured ones.

Profile banners (120° gradients): Lime `#CCF900→#8FD14F`, Ocean `#2160BD→#4FB3D9`, Forest `#0D7550→#6CC58F`, Sunset
`#E05A24→#F2BB3B`, Violet `#5A46D0→#B07AE8`, Rose `#B3306A→#F08AA8`, Graphite `#141414→#4A4A46`, Keys (repeating keycap
stripes of `#F4F2E8`/`#DEDAC9`).

### 2.9 Rank materials

**Course ranks** (`RankBadge`, keycap-shaped, level number on the face, one star per tier, crown at level 10):

| Tier | Face gradient | Body gradient | Ink | Glow |
|---|---|---|---|---|
| Bronze (Novice, Learner) | `#F6CFA8→#CD8752` | `#9A5A2C→#6B3A19` | `#4A250C` | `#E9A46C` |
| Silver (Apprentice, Typist) | `#FBFCFD→#B4BDC8` | `#808B98→#566070` | `#2C333D` | `#D5DCE4` |
| Gold (Adept, Skilled) | `#FFF0B8→#E5A92A` | `#B07408→#7C5104` | `#4B3100` | `#F5CD58` |
| Emerald (Expert, Master) | `#B6F5DA→#1FAE7B` | `#0E7552→#074D36` | `#043222` | `#4FD6A2` |
| Diamond (Virtuoso, Legend) | `#F1F8FF→#A9B9FF` | `#5363B8→#2C3574` | `#1C2257` | `#9FE7F5` |

**Competitive leagues** (`RankEmblem`, a glass-cut geometric gem per league, growing in complexity: triangle, shield,
rhombus, hexagon, octagon, then 4- to 8-point stars; Zenith is a brilliant-cut white diamond; light from the upper left):
Silver `#8B96A3`, Gold `#C9930F`, Diamond `#3F7FE0`, Master `#1F9C70`, Elite `#1A8EB0`, Champion `#B827B8`,
Grandmaster `#7454E0`, Prodigy `#E0601C`, Overlord `#D81E48`, Transcendent `#D9A000`, Zenith `#A9B8D6`. Divisions III, II,
I share the emblem; the division is written in the name.

Leaderboard medals: gold `#FFE58A→#C99410` (ink `#3A2600`), silver `#F4F6F8→#9AA4B0` (`#2C333D`), bronze
`#F1C49B→#B06A35` (`#3B1D07`).

---

## 3. Typography

| Role | Family | Weights in use | Notes |
|---|---|---|---|
| Display and headings (`h1`, `h2`) | **PP Altera Serif** (`--font-serif`) | 400 (headings), 800 available, 100 available | `text-wrap: balance` |
| Everything else | **PP Neue Montreal** (`--font-sans`) | 300, 400, 500, 600, 700, 800 (+ italics) | Body, UI, `h3` and below |
| Typing text, code, keys | **Geist Mono Variable** (`--font-mono`) | variable, used at semibold or less | Examination text, `kbd`, `code` |

Fonts are self-hosted WOFF2 files in `lib/assets/fonts` with `font-display: swap`; Geist Mono comes from
`@fontsource-variable/geist-mono`. PP fonts are licensed by the project owner.

### Type scale in use

| Use | Size | Line height | Other |
|---|---|---|---|
| Home hero h1 | `clamp(42px, 5.4vw, 74px)` | 1 | letter-spacing −0.025em, max 13ch; emphasised word in weight 800 |
| Section h2 (marketing) | `clamp(30px, 4vw, 48px)` | 1.08 | letter-spacing −0.015em |
| Page h1 (app pages) | `clamp(28px, 3.2vw, 36px)` to `clamp(30px, 3.6vw, 42px)` | 1.05 to 1.1 | serif |
| Auth h1 | `clamp(32px, 4vw, 44px)` | 1.05 | letter-spacing −0.01em |
| Legal h2 | 28px | 1.2 | serif |
| Dialog title | 26px | 1.15 | serif |
| Kicker (eyebrow) | 13px | | weight 700, uppercase, letter-spacing 0.08em, `--ink-2` (lime on dark bands) |
| Lede | 17 to 19px (`clamp(17px, 1.5vw, 19px)` on home) | 1.6 | `--ink-2`, max about 65ch |
| Body | 15 to 16.5px | 1.55 to 1.7 | legal prose 16.5px / 1.7 |
| UI labels | 14 to 14.5px | | weight 500 or 600 |
| Small and hints | 12.5 to 13.5px | | `--ink-2` |
| Big figures (results) | about 28px+ | | tabular numerals, weight 700 |
| Typing text (test) | `clamp(21px, 2.3vw, 29px)` | 1.65 | mono; exactly three lines visible |
| Typing text (lesson drill) | `clamp(22px, 2.6vw, 32px)` | 1.6 | mono |
| Typing text (replay) | `clamp(18px, 2vw, 24px)` | 1.6 | mono |

Rules: numbers use `font-variant-numeric: tabular-nums`; paragraphs use `text-wrap: pretty`; headings use `balance`;
inputs are at least 16px to stop iOS zoom.

---

## 4. Layout and spacing

- **Content column:** max width **1180px**, centred, side padding `clamp(16px, 4vw, 40px)`.
- **Page padding:** top `clamp(20px, 4vh, 44px)`, bottom 48px. The shell is at least `100dvh − 70px` tall so the footer
  sits low on short pages.
- **Full-width bands:** `.band` paints `--band` from edge to edge (`inset: 0 calc(50% − 50vw)`) while content stays in the
  column. Body uses `overflow-x: clip` to avoid sideways scroll.
- **Section rhythm (marketing):** vertical padding `clamp(64px, 9vw, 112px)`; section heads max 680px.
- **Reading width:** legal documents max **760px**; auth forms max 460 to 520px; ledes about 44 to 65ch.
- **Gaps:** 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64 px, usually through `clamp()` for larger gaps.
- **Grids:** two-column splits (`minmax(0, 1.05fr) minmax(0, 0.95fr)` hero; `0.9fr / 1.1fr` technique); three-column
  card grids; account area `210px` side navigation plus content; auth `0.95fr / 1fr`.
- **Anchors:** every `[id]` has `scroll-margin-top: 96px` to clear the sticky header.

### Breakpoints in use (all `max-width`)

`420, 480, 520, 560, 600, 640, 720, 760, 820, 860, 900, 960, 1000, 1080, 1100` px. The important ones:

| Width | What changes |
|---|---|
| 1080px | Header "Continue lesson" pill collapses to its badge |
| 900px | Header nav and sign-in buttons move into the menu button; account side nav becomes a horizontal scroller |
| 860px | Auth side panel hidden, form centred; admin dashboard grids become one column |
| 600px | Header shows the logo mark instead of the wordmark |
| 640px / 560px / 480px | Card grids drop to two then one column; dialog actions stack full width |

Also used: `(pointer: coarse)` hides keyboard-shortcut hints and shows a "physical keyboard required" note in finger mapping;
`print` hides header, footer and skip link, and uses plain white/black.

**Recommendation for the rebuild:** consolidate to five breakpoints (480, 640, 900, 1080, 1180).

---

## 5. Shape, borders, depth

- **Radius:** 3px everywhere (`border-radius: 3px`). Progress bars and chips also 3px. Never pill shapes.
- **Borders:** 1px `--line` for cards and dividers; 1px `--line-strong` for inputs, buttons, popovers, dialogs; 4px left
  border for alerts.
- **Shadows:**
  - `--shadow`: light `0 1px 0 rgb(20 20 20 / .04), 0 8px 24px -12px rgb(60 50 20 / .18)`; dark uses black at .9.
  - `--shadow-lg` (popovers, dialogs, menus): light `0 24px 60px -24px rgb(60 50 20 / .35)`.
  - `--lift` (hovered cards).
  - Shadows are warm (brown-tinted) in light mode, pure black in dark mode.
- **Glass:** the header is frosted (`bg 68%`, `blur(18px) saturate(170%)`), with `--glass-shine` inset highlight and
  `--glass-shadow` once scrolled.
- **Textures:** dot grid (`radial-gradient` 1px dots, 22 to 26px spacing) on the hero and auth panel; diagonal hairlines
  (135°, 14px) on the course road band; radial lime glows on dark bands.

### Stacking (z-index)

| Layer | Value | Element |
|---|---|---|
| Band background | −1 | `.band::before` |
| In-component lifts | 1 to 5 | Race runners, profile card, stretched links, profile form preview, game overlays (2) |
| Mobile menu panel | 20 | Inside header |
| Sticky header | 40 | `.site-header` |
| Account menu, skip link | 50 | |
| Consent banner, confetti | 60 | |
| Native `<dialog>` | top layer | Always above everything |

---

## 6. Iconography and brand

- **Icon set:** custom single-path line icons, 24×24 viewBox, stroke `currentColor`, **stroke-width 1.8**, round caps and
  joins, default size 18px (`lib/ui/Icon.svelte`). Names: `restart sun moon system at hash clock text keyboard hand
  palette arrow repeat cursor menu close mail lock download eye chart layers check play pause history signout target flag
  gauge route user shield info chevron volume mute star flame trophy`.
- Icons are decorative (`aria-hidden`); text always carries the meaning.
- Arrow icons inside buttons and `.link-arrow` nudge 3px right on hover.
- **Logo:** `LogoMark` (the looped ⌘-like mark, 335×335 viewBox, 35 stroke) and `LogoWordmark` (mark plus "sqwer"). Both use
  `currentColor`. Header shows the wordmark at 26px tall, the mark at 30px below 600px; footer wordmark 22px, white.
- **Favicon:** `static/favicon.svg`. **Social image:** `static/og.png` (1200×630).

---

## 7. Actions (buttons and links)

One hierarchy, used the same way on every page:

| Class | Look | When |
|---|---|---|
| `.btn-primary` | Lime fill, `--on-accent` text, no border; hover `brightness(.94)` | The single most important action in a region (at most one) |
| `.btn` | `--surface` fill, 1px `--line-strong`; hover `--surface-2` and `--ink-3` border | Secondary alternatives |
| `.btn-danger` | `--error` fill, white text | Irreversible actions, always behind a confirmation |
| `.link-arrow` | Bold text plus arrow, no underline | Navigation to related content, at most one per section |
| Header "Create account" | Outlined in `--ink`; fills `--ink` on hover | Secondary weight so lime stays for the page's main action |

Sizes: default min-height 44px, padding 0 18px, 15px/600; `.btn-lg` 52px, 0 24px, 16px; `.btn-block` full width.
Press feedback: `translateY(1px) scale(.985)`. Disabled: opacity .55, `not-allowed`. Buttons may hold a trailing
`<kbd>` hint (Enter, Space, Tab).

Segmented controls (theme toggle, test settings, period presets): a `--surface` track with 3px padding; the selected option
gets `--bg` and a 1px `--line-strong` ring.

---

## 8. Forms

- Label above the field: 14.5px/600 `--ink`.
- Input: min-height 46px, padding 10px 12px, 1px `--line-strong`, `--bg` fill, 16px text. Hover border `--ink-3`; focus
  border `--ink` plus the global focus ring; invalid border `--error`.
- **Required fields:** a red asterisk drawn by CSS (`.req::before`), hidden from assistive technology; each form starts with
  "Fields marked * are required." (`RequiredNote`).
- Hints 13.5px `--ink-2` under the field; errors 13.5px/600 `--error`, linked with `aria-describedby`.
- Password fields have a Show/Hide toggle inside the field, a four-bar strength meter (amber `#D98A00` at 1 to 2, green at 3
  to 4) with advice, and a live "passwords match" line on confirmation fields.
- Checkboxes: 18px, `accent-color: --ink`, label text 14.5px `--ink-2`.
- Alerts: `.form-alert` (surface, 4px red left border) and `.form-alert.success` (lime left border).
- Forms post to the server and work without JavaScript; with it, they submit in place and keep the values.

---

## 9. Focus and accessibility

- Global focus ring: `outline: 2px solid var(--ink); outline-offset: 2px; box-shadow: 0 0 0 5px var(--accent)`.
  On the dark footer the outline is white.
- Skip link "Skip to content" appears top-left on focus (lime).
- Selection colour: lime with `--on-accent` text.
- Touch: `touch-action: manipulation` and no tap highlight on interactive elements.
- Every `[id]` clears the sticky header when linked.
- Reduced motion removes or shortens every animation (see [MOTION.md](MOTION.md)).
- Contrast: body and UI text meet WCAG AA; do not put `--ink-3` text on `--surface` at sizes under 14px.

---

## 10. Copy and voice

- **Formal, plain, specific.** Full sentences, no slang, no exclamation marks.
- **British English:** colour, practise (verb), centre, organisation.
- **No em dashes** in visible copy. Use a full stop, colon, comma or "to" for ranges.
- **Sentence case** for headings and buttons ("Create an account", "Play ranked").
- Buttons name the action specifically ("Sign out device", "Permanently delete my account"); pending states end with an
  ellipsis ("Signing in…").
- Numbers: `en-GB` formatting, units written out or abbreviated consistently (WPM, %, s, XP).
- Empty values use "None", "No data" or an en dash (`–`), never an em dash.
- Contact address shown publicly: `info@mughram.com`.

---

## 11. Known inconsistencies

Fix these during the rebuild rather than reproducing them:

| Where | Issue |
|---|---|
| `ResultReport.svelte` (fastest/slowest word), `FingerScores.svelte` (accuracy), `account/statistics/+page.svelte` (several cells) | Em dash (U+2014) used as the empty value; use a word such as "None" |
| `MapOverview.svelte` | Uses local `btn primary`, `btn danger` and `solid` classes instead of `.btn-primary` / `.btn-danger` |
| `--font-hand` | Defined but unused (alias of the sans) |
| Breakpoints | Fifteen different widths; consolidate |
| `--ink-3` on `--surface` | Below AA at small sizes; the admin screens were moved to `--ink-2`, check every other use |
| Rank naming | Course ranks (Novice to Legend, keycap badges) and competitive leagues (Silver to Zenith, gems) are separate systems with similar words ("Diamond", "Master"); keep them visually distinct |
