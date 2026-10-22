---
name: sqwer
description: A free touch-typing course, set as a piano method. Every letter wears its finger number.
colors:
  ultramarine: "#3355FF"
  on-ultramarine: "#FFFFFF"
  ultramarine-night: "#7088FF"
  on-ultramarine-night: "#050714"
  porcelain: "#F6F7FB"
  porcelain-band: "#ECEEF6"
  porcelain-well: "#E1E4F0"
  hairline: "#D6DAE8"
  staff-line: "#BCC2D6"
  engraving-ink: "#0E1120"
  ink-prose: "#4A5068"
  ink-quiet: "#5E6480"
  untyped: "#8E94AC"
  night: "#05060D"
  night-band: "#0D1020"
  night-well: "#151A30"
  night-hairline: "#1F2540"
  night-staff-line: "#2C3354"
  night-ink: "#EEF0FA"
  night-ink-prose: "#A3A9C4"
  night-ink-quiet: "#9298B6"
  night-untyped: "#5F6584"
  sky: "#0A6FB0"
  teal: "#0C7563"
  iris: "#5646D1"
  coral: "#B3401F"
  error: "#C22636"
  finger-little: "#6E5EE6"
  finger-ring: "#12A088"
  finger-middle: "#DD6340"
  finger-index: "#2E94DE"
  finger-thumb: "#D9649F"
  metal-bronze: "#CD8752"
  metal-silver: "#B4BDC8"
  metal-gold: "#E5A92A"
  metal-emerald: "#1FAE7B"
  metal-diamond: "#A9B9FF"
  dither-wave: "#4A63FF"
typography:
  display:
    fontFamily: "PP Altera Serif, ui-serif, Georgia, serif"
    fontSize: "clamp(44px, 6.1vw, 88px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "PP Altera Serif, ui-serif, Georgia, serif"
    fontSize: "clamp(32px, 4.4vw, 56px)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  title:
    fontFamily: "PP Altera Serif, ui-serif, Georgia, serif"
    fontSize: "clamp(24px, 2.2vw, 30px)"
    fontWeight: 400
    lineHeight: 1.1
  numeral:
    fontFamily: "PP Altera Serif, ui-serif, Georgia, serif"
    fontSize: "clamp(44px, 4.6vw, 64px)"
    fontWeight: 800
    lineHeight: 1
  lede:
    fontFamily: "PP Neue Montreal, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(16.5px, 1.4vw, 18.5px)"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "PP Neue Montreal, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "PP Neue Montreal, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.3
  reading:
    fontFamily: "PP Altera Serif, ui-serif, Georgia, serif"
    fontSize: "clamp(56px, 8vw, 112px)"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  staff:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "clamp(44px, 6.4vw, 92px)"
    fontWeight: 400
    lineHeight: 1
  figure:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
rounded:
  corner: "3px"
spacing:
  gutter: "clamp(16px, 4vw, 40px)"
  section: "clamp(72px, 10vw, 136px)"
  section-close: "clamp(88px, 12vw, 168px)"
  container: "1180px"
  header: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ultramarine}"
    textColor: "{colors.on-ultramarine}"
    typography: "{typography.label}"
    rounded: "{rounded.corner}"
    padding: "0 20px"
    height: "44px"
  button-primary-large:
    backgroundColor: "{colors.ultramarine}"
    textColor: "{colors.on-ultramarine}"
    rounded: "{rounded.corner}"
    padding: "0 28px"
    height: "56px"
  link-text:
    textColor: "{colors.engraving-ink}"
    typography: "{typography.body}"
  nav-link:
    textColor: "{colors.ink-prose}"
    typography: "{typography.body}"
  nav-link-hover:
    textColor: "{colors.engraving-ink}"
  header-bar:
    backgroundColor: "{colors.porcelain}"
    height: "{spacing.header}"
  band:
    backgroundColor: "{colors.porcelain-band}"
    padding: "{spacing.section} {spacing.gutter}"
  measure:
    padding: "28px 24px 8px"
    height: "340px"
  etude-tile:
    backgroundColor: "{colors.porcelain}"
    rounded: "{rounded.corner}"
    height: "112px"
  step-bar:
    backgroundColor: "{colors.porcelain-well}"
    height: "6px"
  night-band:
    backgroundColor: "{colors.night}"
    textColor: "{colors.night-ink}"
    padding: "{spacing.section} {spacing.gutter}"
  button-primary-night:
    backgroundColor: "{colors.ultramarine-night}"
    textColor: "{colors.on-ultramarine-night}"
    rounded: "{rounded.corner}"
    height: "56px"
  reading-line:
    typography: "{typography.reading}"
    textColor: "{colors.engraving-ink}"
---

# Design System: sqwer

## Overview

**Creative North Star: "The Fingering Edition"**

sqwer is set like a printed piano method. Typing is taught as notation: every typed letter sits on a five-line staff in Geist Mono, its finger number (1 thumb to 5 little finger, counted per hand) engraved above it in that finger's colour, and the course is a score of twelve measures, grouped into movements, read down an ordinary page. Staves, numerals, bar lines and tempo terms are working grammar that carries real information (which finger, which chapter, what speed); they are never ornament, and the page does not dress as a concert hall.

The paper is cool porcelain, the ink is near-black navy, and one ultramarine does exactly two jobs: the action and the playhead (the staff's cursor, the reading caret). Five finger colours are the only other chromatic voice, and they always travel with a numeral. PP Altera Serif sets titles like engraved score headings; PP Neue Montreal carries prose; Geist Mono carries anything typed or measured. Density is generous and calm: wide sections, long measures, hairlines instead of boxes, so that the typing surface is the loudest thing on any screen. Night is deep navy, not grey, and keeps the same grammar: the hero, the close and the header stand in it on the landing page.

Motion is a playhead. Things sweep left to right, ease out from visible defaults, and stop. The landing page is an ordinary vertical page with exactly one scroll-driven moment, the Reading, where a long sentence is typed out under a held caret as you scroll. Around a typing surface everything else recedes; under reduced motion every loop, scrub and entrance is removed and the content stands complete.

**Key Characteristics:**
- Every typed glyph is set on a staff with its finger numeral above it, in its finger colour.
- One ultramarine (Ultramarine Night on dark bands) for the action and the playhead or caret; nothing else is ultramarine-filled.
- Serif titles at weight 400, serif numerals at 800, mono for typed text and figures, sans for prose.
- Hairlines and tonal bands, never cards or shadows, structure the page.
- Every corner is 3px; numeral discs and the rank emblems are the only rounded forms.
- Light porcelain pages alternate with dark night bands that carry a dithered wave field.
- Only the Reading scrubs with scroll; nothing else moves for long.

## Colors

Porcelain and navy ink with a single ultramarine, plus five finger colours that only ever appear as notation.

### Primary
- **Ultramarine** (#3355FF): the Get started action, the staff playhead, the next expected key after a wrong press, the step-count bars, selection highlight and the outer focus halo. White text on it reads at 5.4:1.
- **Ultramarine Night** (#7088FF, with #050714 on it): the accent on every dark band (the hero, the close and the sticky header), where it plays the same two jobs: Get started and the caret or playhead. It reads at 6.4:1 on Night, where Ultramarine reads at only 3.7:1.

### Secondary
- **Finger Colours** (Little #6E5EE6, Ring #12A088, Middle #DD6340, Index #2E94DE, Thumb #D9649F; brighter night pairs in the sidecar): finger identity only. They colour finger numerals, the F and J bump marks, the hand washes and key tints. They are bright enough to fill a key and distinct from the accent and from one another.
- **Course Movements** (Teal, Sky, Iris, Coral): the four part brackets over each part's chapter grid, in course order. Each supporting colour keeps its system job elsewhere: Sky information and speed, Teal success and accuracy (the tick marks), Iris ranks and progress, Coral streaks and energy. Brass (stars and rewards) and Rose (highlights) are defined in the system source but this world does not yet use them.
- **Error** (#C22636): the struck-through wrong key beside the playhead, and errors generally.

### Tertiary
- **Tier Metals** (Bronze, Silver, Gold, Emerald, Diamond; the values given are the face gradient's darker end): the keycap emblem of each of the ten ranks, in the tier's metal with a lighter face gradient, a darker body and a white shine. They mark rank tiers and nothing else.

### Neutral
- **Porcelain** (#F6F7FB): the page, the Reading and the étude tiles.
- **Porcelain Band** (#ECEEF6): full-bleed tonal bands that set off sections.
- **Porcelain Well** (#E1E4F0): tracks under the step bars and idle keys in the étude miniatures.
- **Hairline** (#D6DAE8): section borders, list rules, the header's bottom edge.
- **Staff Line** (#BCC2D6): the five staff lines, measure bar lines, rail circle outlines and hand leader lines.
- **Engraving Ink** (#0E1120): headings, typed letters, the hand outlines, final bar lines and the tempo axis.
- **Ink Prose** (#4A5068): body copy and ledes.
- **Ink Quiet** (#5E6480): footnotes, unfocused chapter numbers, axis numbers, the mid-staff bar line between the hands.
- **Untyped** (#8E94AC): letters on the staff not yet typed. At 2.8:1 on Porcelain it is a state, not a reading colour; the staff's reading is carried by its screen-reader text.
- **Night** (#05060D) with Night Band, Night Well, Night Hairline, Night Staff Line and Night Ink (#EEF0FA), Prose, Quiet, Untyped: the same roles on dark bands, deep navy rather than neutral grey. They are applied as a scope (the `.night` class) to the hero (#rest), the close (#begin) and the sticky header, which re-point every role token within it.
- **Dither Wave** (#4A63FF on Night): the one colour of the dither field behind the dark bands; quantised to four tones.

### Named Rules
**The Two Jobs Rule.** Ultramarine fills the action and draws the playhead. It never fills a decorative surface, a heading or a second competing button.

**The Numeral Escort Rule.** A finger colour never appears without its numeral or a label beside it. Colour is not the only signal.

**The Chord Rule.** The only background gradient on a light surface is the chord: a faint (16% opacity) horizontal wash of the five finger colours, mirrored about the thumbs (little, ring, middle, index, thumb, index, middle, ring, little), masked to fade at top and bottom. It sits behind the staff only. A single finger's wash fading from fingertip to palm inside the hands engraving is colouring, not a second gradient. The 8vw edge fades of the Reading are veils of the surface colour, with no hue.

**The Dither Field Rule.** The owner-approved second background texture is the dither: a wave field of Dither Wave on Night (React Bits Dither, four colours, 3px pixels, wave speed 0.04, mouse interaction on, still under reduced motion) at 55% opacity, masked to fade to nothing at top and bottom. It sits behind the dark bands only (the hero and the close), never behind light sections, the header or the staff, and never carries the chord. The chord stays behind the staff; the dither stays behind night.

## Typography

**Display Font:** PP Altera Serif (with ui-serif, Georgia)
**Body Font:** PP Neue Montreal (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono (with ui-monospace, SF Mono, Menlo)

**Character:** The serif is the engraver: light-handed at weight 400 for titles, heavy at 800 for numerals, the way a score sets its headings and fingerings. Neue Montreal is the calm editorial voice; Geist Mono is the typewriter, used only for what is typed or counted.

### Hierarchy
- **Display** (Altera 400, clamp(44px, 6.1vw, 88px), 0.98, -0.03em): the hero headline in two lines; the closing headline at clamp(40px, 6vw, 84px), 1.0.
- **Headline** (Altera 400, clamp(32px, 4.4vw, 56px), 1.04, -0.02em): section titles, held to 20 to 22ch.
- **Title** (Altera 400, clamp(24px, 2.2vw, 30px), 1.1): chapter titles; the same face at 18 to 26px names games, ranks, tests and principles.
- **Numeral** (Altera 800, clamp(44px, 4.6vw, 64px), 1.0): chapter numbers; at 12 to 34px it sets every finger numeral above a letter and the guidance rail numbers.
- **Lede** (Neue Montreal 400, clamp(16.5px, 1.4vw, 18.5px), 1.65): the paragraph under each section title, max 62ch.
- **Body** (Neue Montreal 400, 15 to 15.5px, 1.55 to 1.6): captions, measure summaries, game and test descriptions.
- **Label** (Neue Montreal 600, 12.5 to 14px): playhead and bracket labels, league names, the hero's three facts. Sentence case, never tracked uppercase.
- **Reading** (Altera 400, clamp(56px, 8vw, 112px), 1.18, -0.02em, nowrap): the single long sentence typed out by scroll; in its static form clamp(30px, 4vw, 52px) at 24ch.
- **Staff** (Geist Mono 400, clamp(44px, 6.4vw, 92px), 1.0): the hero's typeable letters; 64px and 26px in the large and small phrase staves.
- **Figure** (Geist Mono 400, 12 to 14px, tabular): counts, lesson totals, axis values, league thresholds.

### Named Rules
**The Typewriter Rule.** Anything the learner types, and any number that is counted, is set in Geist Mono. Prose is never mono.

**The Engraved Numeral Rule.** Finger numbers and chapter numbers are Altera Serif at weight 800; headings stay at 400. Weight belongs to numerals, not titles.

## Layout

A centred 1180px column with fluid gutters (clamp(16px, 4vw, 40px)) and very generous section rhythm (clamp(72px, 10vw, 136px) top and bottom; the close ends tighter at clamp(40px, 6vw, 72px)). The landing page is an ordinary vertical page of bands bounded by hairlines, in this order: Rest (hero, dark), Hands, Score, the Reading, Practise, Grow, Technique, Tempo, Begin (close, dark). The hero fills the first viewport less the 64px header and centres its content. The staff runs full-bleed while its letters stay aligned to the column's left edge. Light sections alternate between Porcelain and full-bleed Porcelain Band. Two-column figures pair an illustration with its caption at about 0.8fr to 1.2fr (or the reverse) from 1024px.

The first viewport: headline top left, the full-width staff at mid-height, the action at the lower left; on narrow screens the action moves above the staff.

The course is a grid per part, never a scrolling row: chapters sit in 3 columns from 1024px, 2 from 640px and 1 below, each part headed by its title on a 2px bracket in the movement colour (Teal, Sky, Iris, Coral in course order). On narrow screens chapters are separated by a hairline above rather than a staff-line left edge. The ten ranks sit in a grid of 2 columns, 3 from 640px and 5 from 1024px. The guidance rail appears only from 1536px. The tempo scale keeps a 900px minimum and scrolls inside its own frame on small screens, where it is replaced by a two-column league list.

The Reading is the one exception to the vertical flow. From 700px wide with motion allowed it pins for 2200px of scroll or more (13px per character, about 2800px for the current sentence) in a viewport 100dvh less the header; below 700px or under reduced motion it is a normal paragraph in the column with every character visible.

## Elevation & Depth

The world is flat. Depth is tonal and linear: full-bleed bands of Porcelain Band against Porcelain, dark night bands against light ones, hairlines and staff lines, and the sticky night header at 85% Night with a medium backdrop blur. There are no shadows on any surface, with one exception. The layered effects are the chord wash behind the staff and the dither field behind the night bands.

### Shadow Vocabulary
- **Rank emblem shadow** (`filter: drop-shadow(0 3px 6px rgb(0 0 0 / 0.16))`): owner-directed, on the ten rank emblems only. The emblems also use gradients (a face, a body and a radial shine in the tier's metal), which no other element may use.

### Named Rules
**The Engraved Page Rule.** Structure is drawn with lines, not lifted with shadows. If a surface needs separation, give it a tonal band or a hairline.

**The Emblem Exception.** The soft drop shadow and the metal gradients belong to the rank emblems and nothing else. They do not spread to cards, buttons, tiles or panels.

## Shapes

Every rectangle that holds content or acts (buttons, étude tiles, keys, illustrated key caps) has a 3px corner: softened, not round. Curves are reserved for the circular rail numerals and the rank emblems (a rounded keycap, 11px body and 8.5px face, in the tier's metal). Lines are the main form language: 1px staff and bar lines, a 2px playhead, a 4px ultramarine reading caret, 2px coloured brackets over each part. The hands are a hairline engraving (0.55 stroke) with each finger washed in its colour.

## Components

### Buttons
Decisive and singular: one filled ultramarine action, repeated, never a choice of two.
- **Shape:** softened corner (3px).
- **Primary:** Ultramarine with white Neue Montreal 600, 44px tall with 20px sides at 15px in the header; 56px tall with 28px sides at 17px in the hero and close. A 18px stroked arrow follows the label.
- **On night:** the same button takes Ultramarine Night with #050714 text.
- **Hover / Focus:** the large hero action is drawn magnetically (React Bits Magnet, strength 4, at most 6px of travel within 36px padding); brightness lifts 10% and the arrow slides 3px right; pressing nudges it down 1px. Focus is the global ring: 2px ink outline, 2px offset, with a 5px ultramarine halo.
- **Secondary:** there is no secondary button. Secondary actions are plain semibold ink text links ("See the whole course", "Map your fingers").

### Navigation
- **Header:** sticky, 64px, in the night tokens at 85% Night with blur and a hairline bottom edge. Wordmark, then Learn, Practice, Ranked at 15px Neue Montreal 500 in Night Ink Prose turning to Night Ink on hover; Sign in and Get started at the right. Links hide below 768px; Sign in hides below 640px.
- **Guidance rail:** from 1536px, five numbered circles (28px, Altera 800 numerals) at the left edge. The current step fills ultramarine and shows its label in semibold ink; other labels appear on hover.

### The Staff (signature)
The typeable first viewport. Five staff lines over the chord, the home row a s d f | j k l ; in Geist Mono, a finger numeral above each letter, a coloured bump under F and J, an ink-quiet bar line between the hands. It listens only while on screen: a correct key lights its numeral (lifted 6px and scaled 1.18) and advances the 2px ultramarine playhead with an out-expo 300ms move; a wrong key appears struck through in Error beside the playhead, and the expected letter turns ultramarine. Escape restarts. A polite live region speaks each step in words. One demonstration pass plays before input, never under reduced motion; touch devices are told that typing needs a physical keyboard.

### Phrase
The staff's grammar at smaller sizes: a five-line staff with mono glyphs (26px or 64px) and their numerals (12px or 26px). It shows each chapter's new keys and the closing "f j".

### Measure
One chapter in a part's grid: a large serif numeral in Ink Quiet, the serif title, a summary, a Phrase, a mono lesson count and the rank reached around there (min height 340px, 28px by 24px padding). From 640px each chapter after the first in a row is divided by a staff-line left border. The part title sits above the grid on a 2px bracket in its movement colour at 13.5px semibold. The numeral does not change state.

### The Reading
A section of the page, set in Altera 400 at clamp(56px, 8vw, 112px) on a Porcelain Band surface. One long sentence is laid out on a single line (nowrap); every character is a ghost at 10% opacity and becomes full ink as scroll reaches it. A 4px Ultramarine caret is held at 34% of the width while the line slides left under it; the line's left and right edges fade in the surface colour over 8vw (40px to 120px). The section pins (GSAP ScrollTrigger, scrub 0.4) for at least 2200px of scroll. The full sentence is in screen-reader text. Under 700px wide or with reduced motion it is the same sentence as a normal paragraph with every character visible and no caret. This is the page's only scroll-driven moment.

### Rank emblem
Each of the ten course levels is a keycap in its tier's metal (Bronze, Silver, Gold, Emerald, Diamond): a darker body, a lighter gradient face, a radial white shine and a hairline white highlight, the level in Altera at 21 of 64 units, and one white star for each tier reached (one per two levels, up to five). Level 10 has no crown. Emblems are 80px on the landing page, decorative (the rank name and note beside each carry the meaning), and carry the Emblem Exception's shadow.

### Motion
Only four things move on the landing page. The hero headline rises word by word on load (React Bits SplitText). Get started in the hero is drawn magnetically (Magnet). Headings and figures that arrive below the fold ease up once (opacity 0 to 1, 24px up, 0.8s out-expo, 0.08s stagger, ScrollTrigger.batch at top 90%, once); anything on screen at load stays still. The Reading scrubs. Headline numbers are set plainly and do not count up. Under reduced motion everything stands complete, and the dither field is still.

### Hands and Keyboard
Illustrations in the same notation. The hands are a hairline engraving with a legend of numerals and home keys joined to the fingertips by leader lines; the finger just typed on the staff stays at full strength while others fade to 35%. The keyboard tints each key with its finger colour at 16% (90% when highlighted), outlines it in that colour, and engraves the finger number in the corner.

### Étude miniatures
Each game is told on a 112px Porcelain tile ruled with staff lines, animated in CSS: falling notes, a sound wave and caret, a key hunt fuse, a race lane, an echo. Each loop plays three times then rests, and replays on hover or focus. Nothing animates under reduced motion.

### Measured scales
Quantities are drawn on one honest axis: step-kind bars (6px Ultramarine on a Porcelain Well track, on a stated common scale), the ranks as a grid of ten emblems, and the tempo scale where Italian tempo terms sit above a single ink axis (0 to 300 WPM) and leagues below it. Each carries a caption that defines its unit.

## Do's and Don'ts

### Do:
- **Do** set every typed glyph in Geist Mono on a five-line staff, with its finger numeral (piano convention per hand, thumb 1 to little finger 5) above it in that finger's colour.
- **Do** keep Ultramarine (#3355FF, or #7088FF on night) to the action, the playhead, the caret and the next-key cue; render every other emphasis in Engraving Ink weight.
- **Do** use 3px for every rectangular corner, and reserve curves for numeral discs and the rank emblems.
- **Do** separate sections with hairlines and full-bleed Porcelain Band, not shadows or boxed cards.
- **Do** move things as a playhead moves: left to right, ease out (out-expo), from visible defaults, then rest; loops play three times and stop.
- **Do** put every animation under the reduced-motion media condition so it disappears in one place.
- **Do** let the Reading fall back to a plain paragraph below 700px and under reduced motion, with every character visible.
- **Do** limit entrance to the rise, and only for headings and figures arriving below the fold; leave what is on screen at load still.
- **Do** put the dither behind the dark bands only, masked to fade at top and bottom, and keep the light sections plain.
- **Do** lay chapters out as a grid per part under a 2px bracket in the movement colour.
- **Do** give every figure a unit and a definition in a caption beneath its scale.
- **Do** write copy in formal British English, sentence case, with no contractions, exclamation marks or em dashes.

### Don't:
- **Don't** place small labels above headings. In this world labels belong to a mark: a bracket, the playhead, a scale tick.
- **Don't** use a finger colour without its numeral or a text label.
- **Don't** add another background gradient or texture: the chord stays behind the staff and the dither behind dark bands.
- **Don't** scroll anything horizontally or pin anything but the Reading.
- **Don't** use staves, numerals or tempo terms as ornament: each must carry a real finger, chapter or speed.
- **Don't** dress the page as a concert hall: no instruments or sheet-music textures.
- **Don't** add a second filled button beside Get started.
- **Don't** use drop shadows or metal gradients on anything but the rank emblems.
- **Don't** animate numbers up to their value in headlines.
