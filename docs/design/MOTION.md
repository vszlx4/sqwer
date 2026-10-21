# sqwer motion

Every animation, transition and timed effect in the site, with exact durations, easings and reduced-motion behaviour, so
they can be rebuilt one to one in another library (for example Motion, GSAP or the Web Animations API).

Related: [DESIGN_GUIDE.md](DESIGN_GUIDE.md), [COMPONENTS.md](COMPONENTS.md), [INTERACTIONS.md](INTERACTIONS.md).

---

## 1. Principles

1. **Motion explains a change**; it never decorates for its own sake. Entrances are short; feedback is instant.
2. **Fast in, gentle out.** Entrances use a soft deceleration (`cubic-bezier(0.16, 1, 0.3, 1)` or `(0.2, 0.7, 0.2, 1)`).
3. **Rewards may overshoot.** Stars, badges and rank-ups use a spring-like overshoot (`cubic-bezier(0.3, 1.6, 0.5, 1)` or
   `(0.34, 1.56, 0.64, 1)`).
4. **Typing feedback is near-instant** (60 to 160ms) and never delays input.
5. **Only `transform`, `opacity` and `filter`** are animated, except a few widths noted below.
6. **Reduced motion:** a global rule shortens every animation and transition to 0.01ms; view transitions, reveals,
   staggered rises, confetti and count-ups are switched off; looping decorations stop.

### Easing vocabulary

| Name used here | Curve | Used for |
|---|---|---|
| `out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Page-in, rises, progress bars, mobile menu links |
| `out-soft` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Reveals, hover lifts, step entrances |
| `out-pop` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Menus, dialogs, banners |
| `spring` | `cubic-bezier(0.3, 1.6, 0.5, 1)` | Stars, outcome badges, hand legend values |
| `spring-soft` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | XP pop, rank-up emblem |
| `in-quick` | `cubic-bezier(0.4, 0, 1, 1)` | Page-out |
| `ease`, `ease-out`, `linear` | standard | Colour changes, fuses, runners |

### Standard durations

| Token | ms | Use |
|---|---|---|
| instant | 60 to 85 | Key press, caret move |
| fast | 100 to 160 | Colour and background hovers, menu open |
| base | 180 to 260 | Card lifts, banners, overlays, typing chrome fade |
| slow | 300 to 520 | Step entrances, rises, outcome pops |
| reveal | 600 to 900 | Section reveals, rank-ups, count-ups, bar fills |

---

## 2. Global motion (app.css and root layout)

### 2.1 Page transitions (View Transitions API)

Triggered in `routes/+layout.svelte` `onNavigate` when the pathname changes (not for query-only changes), only if
`document.startViewTransition` exists and motion is not reduced.

| Pseudo-element | Animation |
|---|---|
| `::view-transition-old(root)` | `page-out` 150ms `in-quick`: to `opacity 0, blur(6px), scale(.995)` |
| `::view-transition-new(root)` | `page-in` 340ms `out-expo`, 40ms delay: from `opacity 0, blur(10px), translateY(10px)` |
| `site-header` | Excluded (`view-transition-name: site-header`, no animation) so the header never flickers |

The same dissolve is used for in-place swaps through `swap(update)` (`lib/ui/transition.ts`):
- typing test turning into its result, and back on restart;
- lesson step turning into its outcome, the next step, or the completion screen.

### 2.2 Scroll reveal (`use:reveal`, `lib/ui/reveal.ts`)

- One shared `IntersectionObserver` (`rootMargin: 0px 0px -8% 0px`, threshold .08); each element animates once.
- Hidden state: `opacity 0; translateY(18px)`. Shown: 700ms `out-soft` on opacity and transform, with
  `--reveal-delay` for staggering.
- Elements already on screen at load are left as rendered (no flash). Without JavaScript or with reduced motion nothing is
  hidden.
- Used on: home (section heads, timeline milestones with 0/80ms alternating delay, game cards 80ms stagger, rank ladder,
  technique copy and card at 120ms, principles); Practice page (category heads, exam cards 70ms stagger, game list 50ms).

### 2.3 Staggered rise (`.rise`)

`rise` 520ms `out-expo`, delay `calc(var(--i) * 70ms + 60ms)`: from `opacity 0, blur(8px), translateY(14px)`. Set `--i` on
each part. Used for results reports (header, figures, details, guidance, actions), ranked result, lesson cards and
chapter detail in the learning path, account overview steps, public profile panels.

Home hero uses its own `.rise` variant: 700ms `out-soft`, delay `--d` (0, 60, 120, 180, 240ms), from `opacity 0,
translateY(14px)`. Get started options: 600ms `out-soft`, `--i * 90ms`; the path panel 500ms.

---

## 3. Site chrome

| Element | Motion |
|---|---|
| Header bar | On scroll past 8px: border and shadow fade in, 200ms ease |
| Header nav links, footer links, theme options | Colour/background 120 to 140ms ease |
| Mobile menu panel | `menu-in` 180ms `out-pop`: from `opacity 0, translateY(−6px)`; origin top |
| Mobile menu links | `m-in` 260ms `out-expo`, stagger `--i * 40ms`: from `opacity 0, translateY(−4px)` |
| Account menu trigger | Press `translateY(1px)` 140ms; level square `brightness(1.12)` on hover/open |
| Account menu panel and level card | `menu-in` 160ms `out-pop`: from `opacity 0, translateY(−4px) scale(.98)`; origin top right |
| Consent banner | `rise-in` 240ms `out-pop`: from `opacity 0, translateY(8px)` |
| Dialog | `dialog-in` 200ms `out-pop`: from `opacity 0, translateY(8px) scale(.98)`; backdrop fades in 200ms, black 45% with 2px blur |
| Buttons | Background/border/filter 140ms; press `translateY(1px) scale(.985)`; trailing arrow icon `translateX(3px)` 180ms on hover |
| Skip link | Jumps from `top: −60px` to `12px` on focus (no animation) |

---

## 4. Home page (`routes/+page.svelte`)

All loop forever while visible, and stop under reduced motion.

| Preview | Element | Animation |
|---|---|---|
| Hero hands | Fingers | `finger-in` 700ms ease, delay `240ms + i * 70ms` (opacity) |
| | Legend leader lines | `leader-draw` 520ms `(0.4, 0, 0.2, 1)`, delay `700ms + i * 70ms` (stroke-dashoffset to 0) |
| | Legend values | `value-in` 420ms, delay `1000ms + i * 70ms` |
| Falling letters | Keycaps `f j k d g` | `fall` 3.4s linear infinite, `translateY(190px)`, staggered `n * −0.68s` |
| | Burst | `pop-burst` 1.7s ease-out infinite: hidden to 60%, appears at 70%, ends `scale(1.6) rotate(45deg)` faded |
| Falling words | Words | same `fall`, 4.4s, stagger `n * −1.1s` |
| Listen and type | Sound wave (9 bars) | `wave` 1.1s infinite, `scaleY(.2 → 1 → .2)`, stagger `n * −0.13s`; caret `blink` 1s `steps(1)` |
| Key hunt | Target key J | `hunt` 2.4s: dips 2px at 88% (a press); fuse bar `fuse` 2.4s linear `scaleX(1 → 0)` |
| Race | Trails and runners | `trail` / `run` 3.6s `(0.45, 0, 0.55, 1)` infinite; pacer lane 4.4s |
| Echo | Keys s k d l | `echo` 3.6s, stagger `n * 0.35s`: flash lime with glow at 8%, settle green (`#2FC48A` mix) from 58% |
| Game cards | Card | Hover `transform` and border 220ms ease |
| Road cards | Card | Hover `transform` and shadow 220ms ease |

---

## 5. Learning path and lessons

### 5.1 Learning path page (`routes/learn/+page.svelte`)

| Element | Motion |
|---|---|
| Rank progress bar | `transform` 700ms `out-expo` |
| "Ways to start" cards | Border and `transform` 180ms ease |
| Chapter cards | `transform` 180ms `out-expo`, border and background 180ms; enter with `.rise` (`--i` by part and position) |
| Chapter and lesson progress bars | `scaleX` 500ms `out-expo` |
| Chapter detail | Re-keyed on selection: header and lessons `.rise` |
| Lesson rows | `transform`, border, shadow 180ms ease |
| Next lesson tile | `beckon` 2.2s ease-in-out infinite: lime ring `box-shadow 0 0 0 6px` at 35% at the midpoint |

### 5.2 Lesson player (`lib/courses/LessonPlayer.svelte`)

| Element | Motion |
|---|---|
| Step track dots | Border and background 200ms ease |
| Lesson progress bar | `scaleX` 600ms `out-expo` |
| Step | `step-in` 360ms `out-soft`: from `opacity 0, translateY(10px)` |
| Outcome panel | `step-in` 300ms ease |
| Passed outcome badge | `pop` 420ms `spring`: from `scale(.5)` |
| Step changes | View-transition `swap` (see 2.1) |

### 5.3 Lesson complete (`LessonComplete.svelte`, `Stars.svelte`)

| Element | Motion |
|---|---|
| Confetti | Canvas burst (see 8) with 110 pieces (1 to 2 stars), 170 (3 stars) or 240 (rank up) |
| Stars | `star-pop` 520ms `spring`, delay `300ms + i * 260ms`: from `scale(0) rotate(−40deg)`, faded |
| New rank badge | `rank-up` 900ms `cubic-bezier(0.3, 1.5, 0.5, 1)`, 400ms delay: from `scale(.3) rotate(−30deg)`, faded |
| Rank progress bar | `width` 1100ms `out-soft` |

### 5.4 Game frame (shared by Key hunt, Echo, Race; `GameFrame.svelte`)

| Element | Motion |
|---|---|
| Overlays (ready, end, paused) | `fade` 220ms ease (opacity) |
| Count-in numbers 3, 2, 1 | `pop` 500ms `out-expo` per number: from `scale(1.5), blur(6px)`, faded; one number every **520ms** |
| Reading-time bar | `drain` linear for the preview length (5 to 12s): `scaleX(1 → 0)` |
| Lives | Lost life fades and shrinks, 200ms ease |
| Progress bar | `scaleX` 320ms `out-expo` |
| Start | Scrolls the whole game into view smoothly if it is cut off |

### 5.5 Individual games and exercises

| Component | Element | Motion |
|---|---|---|
| Key intro | Key cap | `bob` 1.6s ease-in-out infinite (up 4px); stops when done |
| | Press dots | Background 160ms |
| Typing drill | Progress meter | `width` 200ms linear |
| Key hunt | Key cap | `drop-in` 260ms `out-expo`: from `translateY(−10px) scale(.9)`, faded (re-keyed per key) |
| | Fuse (time left) | `fuse` linear over the window (2.6s down to 1.3s): `scaleX(→ 0)` |
| Echo | Slots | Background and `transform` 160ms; the fading letter fades out in **350ms** |
| | Message | Colour 200ms |
| Falling game | Drops | Positioned every frame (`requestAnimationFrame`) |
| | Typed drop | `burst` 480ms ease-out: `scale(.4) → 1.6`, rotate 45°, fades |
| | A drop lands | Field `shake` 300ms: ±5px horizontally |
| | Count-in numbers | `pulse-in` 650ms: from `scale(1.4)`, faded |
| | Progress, lives | 320ms `out-expo`; 200ms |
| Race | Trails and runners | `width` / `left` 120ms linear (updated every frame) |
| | Caret | `blink` 1s `steps(1)` infinite; turns red briefly (160ms) after a wrong key |
| Listen and type | Replay button | `breathe` 2s ease-in-out infinite (`scale(1.06)`) |
| | Answer card | Background and border 200ms (green or red feedback) |

### 5.6 Placement and getting started

Options rise in with `--i * 90ms` stagger; option cards lift on hover (`transform` 220ms `out-soft`, border, shadow); the
trailing arrow moves 200ms.

---

## 6. Typing test and results

### 6.1 Typing area (`lib/test/Words.svelte`, `TypingTest.svelte`)

| Element | Motion |
|---|---|
| Caret | Lime 3px bar, `transform` **85ms ease-out** to the next character; in dark mode a lime glow (`0 0 12px` at 45%) |
| Caret while idle | `blink` 1.05s `step-end` infinite; idle begins **700ms** after the last keystroke |
| Line scroll | Text block `translateY` **160ms ease-out**; keeps the active line as the second of three; jumps without animation on a fresh test |
| Focus fade | While typing and until the mouse moves, every `.chrome` element (settings, restart, keyboard tools, legend) fades to 0 over **260ms**; the on-screen keyboard fades too |
| Restart button | Colour and background 120ms; `transform` 300ms (rotates) |
| On-screen keyboard keys | `transform` 60ms ease-out (sink 1.5px); fill 70ms ease-out |
| Ranked link | Border 140ms |

### 6.2 Results

| Element | Motion |
|---|---|
| Swap from test to result | View transition (2.1) |
| Report parts | `.rise` staggered (header 0, figures 1, details 2, guidance 3, actions 4) |
| WPM and accuracy | Count up from 0 with `Tween`, **900ms cubic-out**; instant under reduced motion |
| XP badge | `xp-pop` 600ms `spring-soft`, 400ms delay: from `scale(.6)`, faded |
| Result chart | Static SVG; hover/keyboard crosshair and markers appear instantly |
| Replay | Plays keystrokes in real time at 1×, 2× or 4× (`requestAnimationFrame`); keyboard flashes each key |

### 6.3 Ranked result (`RankedResult.svelte`)

| Element | Motion |
|---|---|
| Rank emblem on rank-up | `rank-up` 900ms `spring-soft`: from `scale(.5) rotate(−12deg) blur(10px)`, faded |
| Progress to next rank | `grow` 900ms `out-pop`, 300ms delay: `scaleX(0 → value)` |
| Server check spinner | `spin` 800ms linear infinite |
| Confetti | 220 pieces on a rank-up (not when rejected) |
| Figures | Count up (6.2) |
| Emblem sparkles (`RankEmblem`) | `twinkle` 2.6s ease-in-out infinite: opacity .25 → 1, scale .55 → 1 |

### 6.4 Practice page and exam visuals

| Element | Motion |
|---|---|
| Exam cards | Lift: `transform` 240ms `out-soft`, shadow and border 240ms; "go" arrow 200ms |
| Game list rows | Background 140ms; icon background/border 140ms; arrow `transform` 160ms |
| Exam visual: placement | Halo `pulse` 2.4s infinite (`scale(1.5)`, opacity .2); progress arc `stroke-dashoffset` 700ms `out-soft`; future arc 900ms |
| Exam visual: keys | Keys `transform` 260ms `out-soft`, stagger `--i * 40ms` |
| Exam visual: bars | `transform` 400ms ease, stagger `--i * 18ms` |
| Exam visual: key fills | Background 300ms |

---

## 7. Competitive, finger map, account, admin

| Area | Element | Motion |
|---|---|---|
| Competitive | "Ranked" live dot | `live` 1.8s ease-out infinite: lime ring expands from 0 to 10px and fades |
| | Your emblem | `float` 5s ease-in-out infinite (up 6px) |
| | Next-rank bar | `transform` 800ms `out-expo` |
| | Rank tabs | Background/border 180ms; `transform` 220ms `out-expo` |
| | Rank detail | Re-keyed with `.rise` when a rank is chosen |
| Finger mapping session | Hands and picker | Opacity 160ms / 150ms (dim while waiting for a keystroke) |
| | Coverage bar | `width` 300ms |
| | Prompt characters | Colour 100ms |
| | Finger chips | Background and `transform` 100ms |
| Hands illustration | Fingers | `fill-opacity` 160ms; legend values pop with `spring` 180ms when lit |
| Account side nav, overview steps | | Background/colour 140ms |
| Endless games | Difficulty options | Border and background 140ms; used tries fade 200ms |
| Captcha | Status dot | `pulse` 1s infinite while working or loading |
| Form fields | Input border | 120ms; password reveal button 140ms; strength bars colour 200ms |
| Admin dashboard | Content while loading | Opacity to .55, 160ms; period segments 140ms |
| Admin charts | Crosshair and tooltip | Instant; no entrance animation |

---

## 8. Script-driven effects

| Effect | Implementation | Details |
|---|---|---|
| Confetti (`lib/ui/Confetti.svelte`) | Full-screen fixed canvas, `pointer-events: none`, z-index 60 | Pieces start above the viewport across the middle half; random x speed ±4.5, y 2 to 7; gravity .12 per frame; air drag .99; spin ±.15; rectangles 6 to 13px; colours from the tokens accent, blue, green, amber, orange, violet, rose; fades over the last 600ms of **2600ms**; DPR capped at 2; removed when done; none under reduced motion |
| Count-up (`CountUp.svelte`) | Svelte `Tween` | 900ms cubic-out from 0, or on value change |
| Typing caret and line scroll | CSS transforms set per keystroke | See 6.1 |
| Falling drops, race, replay, drills | `requestAnimationFrame` loops | Pause when the tab is hidden |
| Smooth scroll into a game | `scrollIntoView({ behavior: 'smooth', block: 'center' or 'start' })` | Only if the game is cut off |

---

## 9. Sound (`lib/courses/audio.ts`)

- Web Audio only; nothing is downloaded or recorded.
- Signal chain: low-pass filter at 2200Hz → compressor (threshold −24dB, ratio 8) → master gain .6.
- `tone(frequency, duration = 0.35s, volume = 0.08)`: a triangle oscillator plus a sine overtone at double frequency at 25%;
  15ms attack, exponential decay.
- Echo plays one note per key from a pentatonic scale: 261.63, 293.66, 329.63, 392.00, 440.00, 523.25 Hz. Sound can be
  switched off (`localStorage['sqwer:sound']`).
- Listen and type uses the device's own English speech voices only (`speechSynthesis`, `localService` voices). Without one,
  the word is shown briefly instead.

---

## 10. Reduced motion checklist for the rebuild

- Global: animations and transitions at 0.01ms.
- Off entirely: view transitions, `[data-reveal]` hiding, `.rise`, confetti, count-ups (instant), mobile menu and account menu
  entrances, consent banner rise, every looping decoration (home previews, sparkles, live dot, float, beckon, breathe, bob,
  halo pulse, captcha dot), game overlay fades, count-in pops, fuse and drain bars, rank-up and grow, spinner.
- Still allowed: instant state changes (colours), the typing caret moving (without transition).
