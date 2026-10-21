# sqwer interactions

How the interface behaves: the keyboard model, every shortcut, focus rules, game and lesson mechanics, what is stored
in the browser, and the loading, empty and error states. Together with [UI_MAP.md](UI_MAP.md),
[COMPONENTS.md](COMPONENTS.md), [MOTION.md](MOTION.md) and [DESIGN_GUIDE.md](DESIGN_GUIDE.md) this is the behavioural
contract a rebuilt frontend must keep.

---

## 1. Keyboard model (`lib/ui/typing-focus.ts`)

Installed once in the root layout (`installKeyboardGuards`). Keys with Cmd, Ctrl or Alt, and IME composition, are never
intercepted.

### 1.1 Everywhere

- **Space never scrolls the page.** It still presses a focused button, ticks a checkbox and types in a text field.
  (Prevented only when the target is neither a text field nor a pressable control.)

### 1.2 While a typing surface is active

A typing surface is anything that calls `claimTyping({ focus, key? })`: the typing test (before results), lesson
exercises, endless games, the finger map session and the finger assessment. Surfaces stack; the newest wins.

| Situation | Behaviour |
|---|---|
| Focus is in a text field, or inside an open dialog, menu or listbox | Nothing is intercepted |
| Space while a button or link has focus | Does not press it; focus returns to the surface and the key goes to the exercise |
| A character or Backspace while a button or link has focus | Same: forwarded to the surface (through `key`, or re-dispatched on `document.body` for games that listen on the window) |
| Click anywhere except a text field, dialog or menu | After the click has done its work, focus returns to the surface |
| Surface has its own hidden input (test, drill) | `focus` focuses it with `preventScroll` |
| Game listens on the window | `focus` is `releaseFocus` (blur the active element) |

Elements that are text fields: `textarea`, `select`, `contenteditable`, and `input` except checkbox, radio, button,
submit, reset, range, color, file. Pressable controls: buttons, links, `summary`, `label`, and ARIA button, checkbox,
radio, switch, tab, menuitem, option.

## 2. Shortcuts

| Where | Key | Action |
|---|---|---|
| Whole site | Tab / Shift+Tab | Normal focus order (except where noted below) |
| Header (mobile menu open) | Escape | Close the menu, focus returns to the menu button |
| Account menu | Escape | Close the menu |
| Dialogs | Escape | Close (not for alert dialogs that require a choice) |
| Theme toggle | Arrow keys | Move between System, Light and Dark |
| Typing test (running) | Tab | Restart with new text |
| | Backspace | Delete a character |
| | Ctrl+Backspace or Alt+Backspace | Delete the word |
| | Any character | Typed, even if focus was elsewhere on the page |
| Typing test results | Tab | New test (results are already saved) |
| Lesson player | Tab | Restart the current exercise (only when focus is in the exercise; Shift+Tab always moves focus) |
| | Enter (after a step) | Continue to the next step |
| Game frame (ready or preview) | Space or Enter | Start, or skip the reading preview |
| Game frame | Tab hidden | The game pauses automatically when the tab is hidden |
| Falling words | Space or Enter | Submit the word; Backspace edits it |
| Listen and type | Space or Enter | Replay or submit, depending on the phase |
| Finger map session | 1 2 3 4 5 | Left pinky, ring, middle, index, thumb |
| | 6 7 8 9 0 | Right thumb, index, middle, ring, pinky |
| | Space or Enter | Accept the suggested finger |
| | Backspace | Go back one key |
| | Escape | Finish the session |
| Finger assessment (break) | Enter | Continue (after 800ms, so a held key does not skip) |
| Keyboard component (selectable) | Enter or Space on a key | Select it |
| Hands component (selectable) | Enter or Space on a finger | Select it |
| Result chart, admin charts | Left / Right arrows | Move the crosshair between points |

## 3. Typing test mechanics (`lib/test`, `packages/engine`)

- Settings (`sqwer:settings`): mode `time` (15, 30, 60, 120 s; default 30) or `words` (10, 25, 50, 100; default 25),
  punctuation, numbers, show keyboard (default on), finger zones (default off), live WPM (default on), platform `auto`
  / mac / pc, number row in mapping, ranked readouts (time, speed).
- The timer starts on the first keystroke. Idle state (blinking caret) begins 700ms after the last key.
- Text shows three lines; the active line is kept second; the block slides up as lines finish.
- Keystrokes are recorded with timestamps for the chart, heatmap, replay and the server's anti-cheat replay.
- Mobile virtual keyboards: `beforeinput` events (`insertText`, `deleteContentBackward`, `deleteWordBackward`) are
  used instead of `keydown`.
- While typing, the "chrome" (config, restart, tools, legend, keyboard) fades out until the mouse moves.
- Results are saved locally first and uploaded when signed in. Ranked runs are checked on the server, which can
  reject them (shown in `RankedResult` with the reason).

## 4. Learning path mechanics (`lib/courses`)

- **Structure:** parts, chapters, lessons, steps (`catalog.ts`). Each step is one of: key intro, typing drill, key hunt,
  echo, falling letters or words, race, listen and type.
- **Stars:** each lesson awards up to three stars from its results; XP accumulates into course ranks (`RANKS`, Novice
  to Legend).
- **Adaptive pace** (`sqwer:pace`): one number from 0.7 to 1.3 (default 1) scales falling speed, key windows, pacers
  and accuracy goals. After a failed step: -0.1. After a pass: +0.05 at 96% accuracy or more, +0.02 at 90% or more,
  otherwise -0.02. Ungraded passes leave it unchanged.
- **Placement:** a short exercise that recommends a start chapter (`sqwer:start`).
- **Without an account:** the first lesson can be taken; its result is kept in `sqwer:pending-lesson` and saved when the
  person creates an account. Later lessons show a sign-up gate.
- **Leaving:** "Leave" asks for confirmation if progress would be lost.

### 4.1 Game timings

| Game | Rule |
|---|---|
| Game frame | Count-in 3, 2, 1 at 520ms per number; optional reading preview 5 to 12s with a draining bar |
| Key hunt | One key at a time with a fuse from 2.6s down to 1.3s; 3 lives |
| Echo | Each letter stays lit `showMs` (1400ms at level 1, minus 90ms per level); the fading letter fades in 350ms |
| Falling | Items fall at a speed scaled by pace; a landed item costs a life (field shakes) |
| Race | A pacer moves at `pacerWpm`; finish the passage before it reaches the line |
| Listen and type | The device's own English voice speaks the word; without one the word is shown briefly |

## 5. Endless games (`lib/games`)

- Games: Race, Falling words, Falling letters, Echo, Listen and type, Key hunt.
- Difficulties: Adaptive (starts where you left off, +1 level after a cleared round, -1 after a failed one), Gentle
  (level 2), Steady (4), Brisk (6), Fast (8), Expert (10). Levels 1 to 10.
- Three strikes end a run. Best run, adaptive level and chosen difficulty are kept per game in `sqwer:endless`.
- Round settings by level `L`:

| Game | Settings |
|---|---|
| Race | pacer `20 + 8L` WPM, `10 + L` words |
| Falling words | target `8 + L`, pace `0.75 + 0.06L` |
| Falling letters | target `12 + 2L`, pace `0.75 + 0.07L` |
| Echo | first length `2 + ceil(L/2)`, target one more, shown `1400 - 90(L-1)` ms |
| Listen and type | 6 words, target 4 (L ≤ 4) or 5 |
| Key hunt | target `12 + 2L`, pace `0.75 + 0.06L` |

## 6. Finger map and assessment

- **Session:** type the prompted character; a wrong key shows "You pressed X. Please type Y." and flashes the key. After
  a correct key, pick the finger (1 to 0, click, or accept the suggestion). For shifted characters a second question
  asks which finger held Shift (left or right Shift is detected from the key code).
- Coverage grows per key and context; the overview compares the map with standard touch typing and can export or import
  the profile file.
- **Assessment:** timed rounds per finger with breaks, then speed and accuracy per finger (`FingerScores`).

## 7. Forms

- Required fields show an asterisk; `RequiredNote` explains it above the form.
- Validation runs on the server; errors return inline per field (`aria-invalid`, `aria-describedby`) with values kept.
- Password fields have a reveal button; new passwords show a 4-bar strength meter and the confirmation shows whether it
  matches.
- Human verification (`HumanCheck`) on sign in (when required), sign up and reset: the built-in `Captcha` or
  Turnstile when configured.
- Destructive actions use `ConfirmForm` (dialog, password where needed, typing DELETE to delete the account).
- Submit buttons show a pending label and are disabled while submitting.
- Uploads (avatar) require confirming the rights to the image.

## 8. Browser storage

All in `localStorage`; nothing is sent unless noted. The Cookies page lists the same table for visitors.

| Key | Holds | Sent to the server |
|---|---|---|
| `sqwer:theme` | Theme (applied before first paint by the inline script in `app.html`) | Never |
| `sqwer:settings` | Typing test and keyboard preferences | Never |
| `sqwer:level` | Level chosen in Get started | Copied to the account when signed in |
| `sqwer:start` | Chosen start lesson | Copied to the account when signed in |
| `sqwer:pending-lesson` | First lesson result taken without an account | On sign up |
| `sqwer:sound` | Echo sound on or off | Never |
| `sqwer:endless` | Per game: best run, adaptive level, difficulty | Never |
| `sqwer:pace` | Adaptive course pace | Never |
| `sqwer:resets` | When this browser last discarded data cleared from the account | Never |
| `sqwer:analytics-consent` | Analytics answer and when it was given | Never |
| `sqwer:analytics-id` / `sqwer:analytics-session` | Random analytics identifiers, only after consent | With analytics events |
| `sqwer:device` | Random identifier of this browser, only while signed in | With usage statistics |

Cookie: the session cookie `__Host-sqwer_session` on HTTPS (`sqwer_session` on plain HTTP in development), HttpOnly,
SameSite Lax.

## 9. Loading, empty and error states

| Place | Loading | Empty | Error |
|---|---|---|---|
| History | "Loading your results…" | "No results yet" with "Browse examinations" | |
| Learning path | Server-rendered | No progress: "Start from the beginning" | |
| Competitive leaderboard | Server-rendered | "No one is on this leaderboard yet. Play ranked to take the first place." | |
| Ranked result | Spinner "Checking the result on the server…" | | Rejected run with the reason |
| Result save | Saved locally at once | | Upload retried later; local copy kept |
| Admin analytics | Content dims to 55% while a new period loads | "Nothing recorded in this period." | |
| Forms | Pending label on submit | | Inline field errors and a message at the top |
| Database unavailable | | | Error page with a reference code |
| Unknown page | | | "This page could not be found." |
| Listen and type without a voice | | | The word is shown briefly instead |
| Storage unavailable (private mode) | | | Settings apply for the visit only, silently |

## 10. Accessibility behaviours to keep

- Skip link; landmarks (`header`, `nav`, `main`, `footer`); one `h1` per page.
- Visible focus on every control (`:focus-visible`): a 2px ink outline at 2px offset plus a 5px lime ring, 3px radius.
- `aria-current="page"` on the active nav and account links.
- Charts are keyboard operable (arrow keys) and have text alternatives.
- Live results and game status use polite live regions.
- Colour is never the only signal: errors also have text, finger colours have labels, ranks have names.
- Reduced motion is honoured everywhere (MOTION.md section 10).
