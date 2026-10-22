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
  film-black: "#070914"
  film-edge-amber: "#E8B34B"
  game-card: "#121212"
  game-card-border: "#262626"
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
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1
  orbital-outer:
    fontFamily: "PP Altera Serif, ui-serif, Georgia, serif"
    fontSize: "30px"
    fontWeight: 400
  orbital-inner:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "15px"
    fontWeight: 400
    letterSpacing: "2px"
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
  film-strip:
    backgroundColor: "{colors.film-black}"
    rounded: "{rounded.corner}"
  film-frame:
    backgroundColor: "{colors.porcelain}"
    textColor: "{colors.engraving-ink}"
    rounded: "2px"
  game-card:
    backgroundColor: "{colors.game-card}"
    rounded: "{rounded.corner}"
    padding: "14px 14px 20px"
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

sqwer is set like a printed piano method. Typing is taught as notation: every typed letter sits on a five-line staff in Geist Mono, its finger number (1 thumb to 5 little finger, counted per hand) engraved above it in that finger's colour, and the course is laid out as a contact sheet of twelve frames, grouped into four strips, on an ordinary vertical page. Staves, numerals, bar lines and tempo terms are working grammar that carries real information (which finger, which chapter, what speed); they are never ornament, and the page does not dress as a concert hall.

The paper is cool porcelain, the ink is near-black navy, and one ultramarine does exactly two jobs: the action and the playhead (the staff's cursor, the reading caret). Five finger colours are the only other chromatic voice, and they always travel with a numeral. PP Altera Serif sets titles like engraved score headings; PP Neue Montreal carries prose; Geist Mono carries anything typed or measured. Density is generous and calm: wide sections, long measures, hairlines instead of boxes, so that the typing surface is the loudest thing on any screen. Night is deep navy, not grey, and keeps the same grammar: the hero, the games, the close and the header stand in it on the landing page, and the world journey opens a night circle in the middle of a light page.

Motion is a playhead. Things sweep left to right, ease out from visible defaults, and stop. The landing page is an ordinary vertical page with two pinned scroll moments, the Reading (a long sentence typed out under a held caret) and the World (a circle of night opens and the four parts turn on rings of type), plus headings that fill with ink from the baseline as they arrive. Under reduced motion every loop, scrub and entrance is removed and the content stands complete.

**Key Characteristics:**
- Every typed glyph is set on a staff with its finger numeral above it, in its finger colour.
- One ultramarine (Ultramarine Night on dark bands) for the action and the playhead or caret; nothing else is ultramarine-filled.
- Serif titles at weight 400, serif numerals at 800, mono for typed text and figures, sans for prose.
- Hairlines and tonal bands, never cards or shadows, structure the page.
- Every corner is 3px; numeral discs and the rank emblems are the only rounded forms.
- Light porcelain pages alternate with dark night bands (hero, games, close) and a scroll-opened night circle; the hero and close carry a dithered wave field.
- Type travels in circles and film: the Orbital Type, the World rings and the contact sheet are the signature forms.
- Only the Reading and the World pin; headings rise with ink; nothing else moves for long.

## Colors

Porcelain and navy ink with a single ultramarine, plus five finger colours that only ever appear as notation.

### Primary
- **Ultramarine** (#3355FF): the Get started action, the reading caret, the grease-pencil ring and tag on frame 1, the step-count bars, selection highlight and the outer focus halo. White text on it reads at 5.4:1.
- **Ultramarine Night** (#7088FF, with #050714 on it): the accent on every dark band (the hero, the games, the close, the world circle and the sticky header), where it plays the same two jobs: Get started and the caret or playhead; it also lights the mono inner ring of the Orbital Type and the game previews' lit keys. It reads at 6.4:1 on Night, where Ultramarine reads at only 3.7:1.

### Secondary
- **Finger Colours** (Little #6E5EE6, Ring #12A088, Middle #DD6340, Index #2E94DE, Thumb #D9649F; brighter night pairs in the sidecar): finger identity only. They colour finger numerals, the F and J bump marks, the hand washes and key tints. They are bright enough to fill a key and distinct from the accent and from one another.
- **Course Movements** (Teal, Sky, Iris, Coral): the four part title brackets on the contact sheet strips, in course order. Each supporting colour keeps its system job elsewhere: Sky information and speed, Teal success and accuracy (the tick marks), Iris ranks and progress, Coral streaks and energy. Brass (stars and rewards) and Rose (highlights) are defined in the system source but this world does not yet use them.
- **Error** (#C22636): the struck-through wrong key beside the playhead, and errors generally.

### Tertiary
- **Tier Metals** (Bronze, Silver, Gold, Emerald, Diamond; the values given are the face gradient's darker end): the keycap emblem of each of the ten ranks, in the tier's metal with a lighter face gradient, a darker body and a white shine. They mark rank tiers and nothing else.

### Neutral
- **Porcelain** (#F6F7FB): the page, the Reading and the contact sheet frames.
- **Porcelain Band** (#ECEEF6): full-bleed tonal bands that set off sections.
- **Porcelain Well** (#E1E4F0): tracks under the step bars and step-bar tracks.
- **Hairline** (#D6DAE8): section borders, list rules, the header's bottom edge.
- **Staff Line** (#BCC2D6): the five staff lines, measure bar lines, rail circle outlines and hand leader lines.
- **Engraving Ink** (#0E1120): headings, typed letters, the hand outlines, final bar lines and the tempo axis.
- **Ink Prose** (#4A5068): body copy and ledes.
- **Ink Quiet** (#5E6480): footnotes, unfocused chapter numbers, axis numbers, the mid-staff bar line between the hands.
- **Untyped** (#8E94AC): letters on the staff not yet typed. At 2.8:1 on Porcelain it is a state, not a reading colour; the staff's reading is carried by its screen-reader text.
- **Night** (#05060D) with Night Band, Night Well, Night Hairline, Night Staff Line and Night Ink (#EEF0FA), Prose, Quiet, Untyped: the same roles on dark bands, deep navy rather than neutral grey. They are applied as a scope (the `.night` class) to the hero (#rest), the games (#games), the close (#begin), the world's dark circle and the sticky header, which re-point every role token within it.
- **Dither Wave** (#4A63FF on Night): the one colour of the dither field behind the hero, the world circle and the close; quantised to four tones.
- **Film Black** (#070914): the base of the contact sheet strips and of the strip title tags; the one dark that is not a night token, used inside light pages. Frames on it are Porcelain, captions Night Ink, lesson counts Night Ink Quiet.
- **Film Edge Amber** (#E8B34B): the edge code (1A ▸) above each frame, on Film Black only. A small film-stock mark, not an accent.
- **Game Card** (#121212, 1px #262626 border, #f2f2ee text): the near-black neutral cards of the game previews inside the Games night band, ported from the stable site. Preview colour comes from the accent (lit keys, waves, trails) and the green #2FC48A of the echo game's solved keys.

### Named Rules
**The Two Jobs Rule.** Ultramarine fills the action and draws the playhead. It never fills a decorative surface, a heading or a second competing button.

**The Numeral Escort Rule.** A finger colour never appears without its numeral or a label beside it. Colour is not the only signal.

**The Chord Rule.** The only background gradient on a light surface is the chord: a faint (16% opacity) horizontal wash of the five finger colours, mirrored about the thumbs (little, ring, middle, index, thumb, index, middle, ring, little), masked to fade at top and bottom. It sat behind the hero staff, which has been removed; the landing page currently builds no chord, and any future use stays behind a staff. A single finger's wash fading from fingertip to palm inside the hands engraving is colouring, not a second gradient. The 8vw edge fades of the Reading are veils of the surface colour, with no hue.

**The Dither Field Rule.** The owner-approved second background texture is the dither: a wave field of Dither Wave on Night (React Bits Dither, four colours, 3px pixels, wave speed 0.04, mouse interaction on, still under reduced motion) at 55% opacity, masked to fade to nothing at top and bottom. It sits behind the hero, the world circle and the close only, never behind light sections, the Games band, the header or a staff, and never carries the chord. The Dither component releases its WebGL context only when the canvas leaves the page, so a development remount does not blank it.

## Typography

**Display Font:** PP Altera Serif (with ui-serif, Georgia)
**Body Font:** PP Neue Montreal (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono (with ui-monospace, SF Mono, Menlo)

**Character:** The serif is the engraver: light-handed at weight 400 for titles, heavy at 800 for numerals, the way a score sets its headings and fingerings. Neue Montreal is the calm editorial voice; Geist Mono is the typewriter, used only for what is typed or counted.

### Hierarchy
- **Display** (Altera 400, clamp(44px, 6.1vw, 88px), 0.98, -0.03em): the hero headline in two lines (clamp(44px, 5.4vw, 80px) in the build); the closing headline at clamp(40px, 6vw, 84px), 1.0.
- **Headline** (Altera 400, clamp(32px, 4.4vw, 56px), 1.04, -0.02em): section titles, held to 20 to 22ch, every one set in Rising Ink (see Components); the World title runs larger at clamp(40px, 6vw, 84px).
- **Title** (Altera 400, clamp(24px, 2.2vw, 30px), 1.1): the same face at 18 to 26px names games, ranks, tests and principles.
- **Numeral** (Altera 800, clamp(44px, 4.6vw, 64px), 1.0): chapter numbers (the contact sheet frames set them at clamp(40px, 5vw, 72px), Film-frame grey #BCC2D6); at 12 to 34px it sets every finger numeral above a letter and the guidance rail numbers.
- **Lede** (Neue Montreal 400, clamp(16.5px, 1.4vw, 18.5px), 1.65): the paragraph under each section title, max 62ch.
- **Body** (Neue Montreal 400, 15 to 15.5px, 1.55 to 1.6): captions, measure summaries, game and test descriptions.
- **Label** (Neue Montreal 600, 12.5 to 14px): playhead and bracket labels, league names, the hero's three facts. Sentence case, never tracked uppercase.
- **Reading** (Altera 400, clamp(56px, 8vw, 112px), 1.18, -0.02em, nowrap): the single long sentence typed out by scroll; in its static form clamp(30px, 4vw, 52px) at 24ch.
- **Staff** (Geist Mono 400, 26px and 64px, 1.0): the glyphs of the Phrase staves (contact sheet frames, close, keyboard figure).
- **Orbital** (outer ring Altera 400 at 30px; inner ring Geist Mono 400 at 15px with 2px tracking, accent): the two rings of type in the hero's Orbital Type. The World rings set the four part titles in Altera at 34, 30, 26 and 22px.
- **Figure** (Geist Mono 400, 12 to 14px, tabular): counts, lesson totals, axis values, league thresholds.

### Named Rules
**The Typewriter Rule.** Anything the learner types, and any number that is counted, is set in Geist Mono. Prose is never mono.

**The Engraved Numeral Rule.** Finger numbers and chapter numbers are Altera Serif at weight 800; headings stay at 400. Weight belongs to numerals, not titles.

## Layout

A centred 1180px column with fluid gutters (clamp(16px, 4vw, 40px)) and very generous section rhythm (clamp(72px, 10vw, 136px) top and bottom; the close ends tighter at clamp(40px, 6vw, 72px)). The landing page is an ordinary vertical page of bands bounded by hairlines, in this order: Rest (hero, dark), Hands, Reading, World, Score (the contact sheet), Practise, Games (dark), Grow (ranks), Technique, Tempo, Begin (close, dark). The hero fills the first viewport less the 64px header and centres its content. Light sections alternate between Porcelain and full-bleed Porcelain Band. Two-column figures pair an illustration with its caption at about 0.8fr to 1.2fr (or the reverse) from 1024px.

The first viewport: a dark band with the headline, lede, three facts and Get started on the left, and the Orbital Type (clamp(240px, 31vw, 420px) square) on the right from 1024px; below 1024px the circle moves above the text.

The course is a contact sheet, never a scrolling row: four strips stacked, one per part, each with three frames side by side (one column below 720px, where each summary is shown beneath its frame). The part title sits on the strip's top edge in its movement colour with a 2px bracket mark. The games sit in a grid of 3 columns, 2 below 1024px and 1 below 640px, with 14px gaps. The ten ranks sit in a grid of 2 columns, 3 from 640px and 5 from 1024px. The guidance rail appears only from 1536px. The tempo scale keeps a 900px minimum and scrolls inside its own frame on small screens, where it is replaced by a two-column league list.

The Reading and the World are the two exceptions to the vertical flow. From 700px wide with motion allowed the Reading pins for max(1000, 5px per character) of scroll (about 1100px for the current sentence) in a viewport 100dvh less the header; the World pins for about 3.1 viewport heights in the same frame. Below 700px or under reduced motion the Reading is a normal paragraph with every character visible and the World is a plain night band listing the four parts.

## Elevation & Depth

The world is flat. Depth is tonal and linear: full-bleed bands of Porcelain Band against Porcelain, dark night bands against light ones, hairlines and staff lines, and the sticky night header at 85% Night with a medium backdrop blur. There are no shadows on any surface, with one exception (the game previews' lit keys and floor glow in the accent, a light emission inside near-black cards, not a drop shadow). The layered effects are the dither field behind the hero, world and close, and the grey-lit dark game cards.

### Shadow Vocabulary
- **Rank emblem shadow** (`filter: drop-shadow(0 3px 6px rgb(0 0 0 / 0.16))`): owner-directed, on the ten rank emblems only. The emblems also use gradients (a face, a body and a radial shine in the tier's metal), which no other element may use.

### Named Rules
**The Engraved Page Rule.** Structure is drawn with lines, not lifted with shadows. If a surface needs separation, give it a tonal band or a hairline.

**The Emblem Exception.** The soft drop shadow and the metal gradients belong to the rank emblems and nothing else. They do not spread to cards, buttons, tiles or panels.

## Shapes

Every rectangle that holds content or acts (buttons, strips, game cards, keys, illustrated key caps) has a 3px corner (film frames 2px): softened, not round. Curves are reserved for the circular rail numerals, the rank emblems and the circular forms of the journey: the Orbital Type rings, the World rings and the circle clip that opens the night, plus the hand-drawn grease-pencil ellipse on frame 1. The rank emblem is a rounded keycap (11px body and 8.5px face, in the tier's metal). Lines are the main form language: 1px staff and bar lines, a 2px playhead, a 4px ultramarine reading caret, 2px coloured brackets on each part title. The hands are a hairline engraving (0.55 stroke) with each finger washed in its colour.

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

### Orbital Type (signature)
The hero's rotating circle, 420px at most. The logo mark sits in the centre at 22% width. Two rings of type are set on SVG circles with textPath: the outer in Altera 30px, ink, "sqwer · learn to type with every finger · …" turning once in 60s; the inner in Geist Mono 15px, accent, "a s d f · j k l ; · home row · 5 4 3 2 …" turning the opposite way in 90s. Two 1px Night Staff Line circles frame the rings (radius 196 and 104 of 420). Under reduced motion the rings are static and still read around the circle. It carries a text alternative and has no input.

### Phrase
The notation grammar: a five-line staff with mono glyphs (26px or 64px) and their numerals (12px or 26px). It shows each chapter's new keys on the contact sheet, the closing "f j" and the keyboard figure. The hero no longer carries a typeable staff.

### Contact Sheet
The course as film. Four Film Black strips (one per part) each have a title tag at the top left (Film Black, 12.5px semibold in the movement colour, with a 14px by 2px bracket), sprocket-hole rails above and below (16px tall, repeating 12px holes on a 28px pitch), and three frames. Each frame is a Porcelain still at 16:10 with a 2px corner holding a large Altera 800 numeral in #BCC2D6 and the chapter's Phrase at the foot; above it at the right, an edge code (1A ▸, mono 10px, Film Edge Amber); beneath it a caption with the serif title and a mono line (lesson count and the rank reached, in Night Ink Quiet). Hover or focus lifts the frame 3px and fades up the summary over it in Engraving Ink with Night Ink text; the summary stays in the page for assistive technology. Frame 1 is ringed by a hand-drawn Ultramarine grease-pencil ellipse (4px stroke, slightly rotated and broken) with a "Start here" tag in the accent. Frames take a 2px accent focus outline. One column below 720px.

### The Reading
A section of the page, set in Altera 400 at clamp(56px, 8vw, 112px) on a Porcelain Band surface. One long sentence is laid out on a single line (nowrap); every character is a ghost at 10% opacity and becomes full ink as scroll reaches it, fading in over about four characters (a soft edge). A 4px Ultramarine caret is held at 34% of the width while the line slides left under it; both move by fractions of a character, never by whole characters. The line's left and right edges fade in the surface colour over 8vw (40px to 120px). The section pins (GSAP ScrollTrigger, scrub 1.1) for max(1000, 5px per character) of scroll, about 1100px. The full sentence is in screen-reader text. Under 700px wide or with reduced motion it is the same sentence as a normal paragraph with every character visible and no caret.

### World
The pinned journey, about 3.1 viewport heights (scrub 1). The light page opens on the title "Step inside the course." and a lede; a circle clip-path grows from the middle (0% to 75%) revealing a dark world (night tokens, dither field) while the light page scales to 1.18 and fades. Four rings of type, the course parts in Altera (radii 352, 292, 232, 172 of an 800 square, sizes 34, 30, 26, 22px, alternating Night Ink and Night Ink Prose), rotate with scroll, opposite ways in turn. A note per part appears and fades in sequence: the part title in serif, its new keys in mono in the accent, and its chapter range in body. Then the circle closes and the light page returns. Under 700px or reduced motion it is a plain night band (min 70vh) with the four notes listed.

### Rising Ink
Every section heading is two stacked copies: a faint ghost (ink at 15% opacity) and an identical copy clipped from the baseline (clip-path inset 100% to 0) that rises as the heading scrolls in (scrub 0.8, top 92% to top 55%). Without JavaScript or under reduced motion the heading is fully inked. The ghost is hidden from assistive technology.

### Rank emblem
Each of the ten course levels is a keycap in its tier's metal (Bronze, Silver, Gold, Emerald, Diamond): a darker body, a lighter gradient face, a radial white shine and a hairline white highlight, the level in Altera at 21 of 64 units, and one white star for each tier reached (one per two levels, up to five). Level 10 has no crown. Emblems are 80px on the landing page, decorative (the rank name and note beside each carry the meaning), and carry the Emblem Exception's shadow.

### Motion
The hero headline rises word by word on load (React Bits SplitText). Get started in the hero is drawn magnetically (Magnet). The Orbital Type turns on a slow CSS loop. Headings fill with Rising Ink as they arrive. The Reading and the World are the two pinned, scrubbed scenes. Figures that arrive below the fold ease up once (opacity 0 to 1, 24px up, 0.8s out-expo, 0.08s stagger, ScrollTrigger.batch at top 90%, once). Game previews loop continuously inside their cards. Headline numbers are set plainly and do not count up. Under reduced motion everything stands complete: rings static, ink full, previews still, dither still.

### Hands and Keyboard
Illustrations in the same notation. The hands are a hairline engraving with a legend of numerals and home keys joined to the fingertips by leader lines; the legend can light one finger at full strength while others fade to 35%. The keyboard tints each key with its finger colour at 16% (90% when highlighted), outlines it in that colour, and engraves the finger number in the corner.

### Game cards
The six games told as live previews on near-black cards (Game Card #121212, 1px #262626 border, 3px corner, 14px padding; border lifts to #3A3A3A and the card 3px on hover), inside the Games night band. Each has a 170px preview well (#0B0B0B with a faint dot grid and a soft accent glow from below), then a bold sans game name at 18px and a 14.5px description in #B9B9B3. Previews: falling keycaps with a burst and a glowing accent floor; falling words; listen (a voice wave in accent bars and a typed word with a blinking caret); key hunt (a mini keyboard with one lit key and a running fuse); race (two lanes with trails, accent and violet runners, a checkered flag); echo (keys lighting in turn, then settling green). Nothing animates under reduced motion.

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
- **Do** let the Reading and the World fall back to plain content below 700px and under reduced motion, with every character visible and the parts listed.
- **Do** set every section heading in Rising Ink: a 15% ghost with the inked copy rising over it.
- **Do** limit entrance to the rise, and only for headings and figures arriving below the fold; leave what is on screen at load still.
- **Do** put the dither behind the hero, the world circle and the close only, masked to fade at top and bottom, and keep the light sections and the Games band plain.
- **Do** lay the course out as a contact sheet: one strip per part, three frames, the part title in its movement colour.
- **Do** give every figure a unit and a definition in a caption beneath its scale.
- **Do** write copy in formal British English, sentence case, with no contractions, exclamation marks or em dashes.

### Don't:
- **Don't** place small labels above headings. In this world labels belong to a mark: a bracket, the playhead, a scale tick.
- **Don't** use a finger colour without its numeral or a text label.
- **Don't** add another background gradient or texture: the chord stays behind a staff and the dither behind the hero, world and close.
- **Don't** scroll anything horizontally or pin anything but the Reading and the World.
- **Don't** use staves, numerals or tempo terms as ornament: each must carry a real finger, chapter or speed.
- **Don't** dress the page as a concert hall: no instruments or sheet-music textures.
- **Don't** add a second filled button beside Get started.
- **Don't** use drop shadows or metal gradients on anything but the rank emblems.
- **Don't** animate numbers up to their value in headlines.
