# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Beginners learning alone:** teens and adults who have never touch-typed, usually at home on a laptop or desktop
  with a physical keyboard. They need to be guided, not left to explore: every next step must be obvious.
- **Schools:** teachers using sqwer with a class, and the pupils in it. Classroom-specific features (class lists,
  teacher views) do not exist yet; future work should not assume them, but should keep the guided path clear enough
  for a pupil following a teacher's instruction.
- **Self-taught typists (secondary):** people who already type fast with their own fingering and want to correct it,
  through the finger map and finger speed assessment.

## Product Purpose

sqwer is a free touch-typing course. It takes a learner from their first two keys (F and J) to fluent typing through
short lessons, games and tests, and it learns which finger the learner actually uses for each key. Success is a
beginner who never has to wonder what to do next: they start lesson 1 quickly, keep coming back, and finish chapters.

## Positioning

A guided path plus a finger map. The course is one clear road (12 chapters, 125 lessons, in four parts), and sqwer
records which finger a typist uses for every key, including habits that depend on the neighbouring key, then teaches
the fingers they skip. Free, with no advertising and no tracking.

## Operating Context

- Lessons mix steps of eight kinds: key introductions, drills, key hunt, echo, falling letters or words, race, listen
  and type, and checkpoints. Each lesson awards up to three stars; points build ten course ranks (Novice to Legend).
- Six endless games, eight examinations (placement, timed, word-count, punctuation and numbers, endurance,
  competitive, finger mapping, finger speed) and a ranked mode with eleven leagues checked on the server.
- The first lesson can be taken without an account; later lessons need a free account, which saves progress on every
  device. A one-minute placement test can recommend a starting chapter.
- Typing surfaces need a physical keyboard; phones can browse and read but are not the typing context.

## Capabilities and Constraints

- The current site (`apps/web`, SvelteKit, on `main`) is live product truth; this app (`apps/web-react`, Next.js) is the
  React rewrite on `v2/react-rewrite`. Links to pages not yet rebuilt are placeholders (`src/lib/links.ts`).
- Copy is formal British English: no contractions, no exclamation marks, no em dashes, sentence case.
- Privacy is a product commitment: no third-party requests, self-hosted fonts and assets, analytics only with consent.
- Every figure shown must be defined, and the same rules apply to every result.

## Brand Commitments

- Name **sqwer**, lower case. The logo is a single continuous looped line (`LogoMark`, `LogoWordmark`).
- Typefaces owned and licensed: PP Altera Serif (titles), PP Neue Montreal (everything else), Geist Mono (typing
  text and technical labels).
- Binding direction from the owner (2026-10-21): an elegant design, the serif carrying the elegance, blended with a
  modern technical precision and smooth, interactive scrolling. Corners softened but not round (the current 3px).
  The Ultramarine palette is the chosen base.

## Evidence on Hand

- Real course facts, exported from the code to `src/content/course.json` (`npm run content`): 4 parts, 12 chapters
  with titles and summaries, 125 lessons, step counts by kind, 10 ranks with notes, 11 leagues with WPM thresholds,
  8 examinations with purposes and durations.
- Live figures from the database (learners, lessons completed, tests taken) may be designed for, shown as clearly
  marked placeholder values until wired.
- No testimonials, reviews, press, customer logos or school case studies exist. Do not fabricate them.

## Product Principles

1. **Guide, never leave them to explore.** Every screen names the one next step for a beginner.
2. **Explain every figure.** Numbers carry a label, a unit and a definition.
3. **Respect the learner.** Free, no ads, no tracking, no dark patterns, no competition forced on beginners.
4. **Show the hands.** Technique (which finger, where it rests) is the product's heart, not a side feature.
5. **Calm while typing.** Around a typing surface, everything else recedes.

## Accessibility & Inclusion

WCAG 2.2 AA: 4.5:1 for text, visible focus, full keyboard use, reduced motion honoured everywhere. Colour is never the
only signal (finger colours always have labels). Inputs at least 16px. Pupils and beginners may be young or new to
computers: plain words, large targets, no time pressure outside games.
