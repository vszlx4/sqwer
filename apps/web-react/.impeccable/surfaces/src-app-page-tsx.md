---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Surface brief: landing page, "One long score"

Scope: the production landing page of the React rewrite (apps/web-react), replacing the Fingering lab page. Mode: Persuade.
Audience: beginners learning alone and pupils sent by a teacher; self-taught typists second.
Action: Get started (opens the current /start flow; placeholder until wired). Present in the nav and in the first measure.
Proof and content: the real course (src/content/course.json): 4 parts, 12 chapters, 125 lessons, 8 step kinds, 10 ranks, 11 leagues, 8 examinations, six games, the finger map, three principles. Live database figures only as marked placeholders.
Constraints: PRODUCT.md and DESIGN.md (the user approved stretching its no-cards rule for this page); formal British copy, no eyebrows above headings; reduced motion respected; works without a pointer; phones get a normal vertical page; GSAP for motion, Lenis for smoothing, React Bits where a pick earns its place.
Chosen sketch: .impeccable/mocks/decision/one-long-score.html (user pick, round b768f6dc). Build path: code-led.

## Revision 2 (owner feedback, supersedes the horizontal-score contract below)

The owner did not want a horizontal score. The page is an ordinary vertical page. The only scroll-driven moment is the reading section in the middle: it pins and a long sentence types out as you scroll, sliding left under a caret. The hero and the close are dark bands (night tokens) with the dither wave field behind them; the rest is porcelain. Course levels are the ten original ranks from the Svelte site (keycap emblems in tier metals, stars), with no crown on level 10. React Bits starter components (contact sheet, orbital type, rising ink) are to be added once the license key is available.

## Direction contract (original, kept for history)

THESIS: The whole landing page is one horizontal score, read left to right under a fixed ultramarine playhead; it refuses the vertical stack of sections and the row of equal feature cards.
OWN-WORLD: Porcelain paper, Engraving Ink, one ultramarine for the action and the playhead; five-line hairline staves, serif numerals at 800, Geist Mono for everything typed or counted, PP Altera Serif titles, Neue Montreal prose. Finger colours always with numerals. Chord wash behind the staff only.
STORY: In seconds the visitor sees that sqwer teaches which finger to use, starting with F and J, along one clear score of twelve chapters; they believe it is calm, serious and free; they press Get started.
FIRST VIEWPORT: Nav across the top. The first measure holds the display headline top left and the live typeable home-row staff at mid-height; Get started sits below with the F and J line; the next measures already enter from the right edge under the playhead at the left; a thin progress bar at the foot tracks the score.
FORM: One long horizontal score pinned by GSAP ScrollTrigger above 900px with motion allowed, native vertical sections below that and under reduced motion; position 7 of 7 on my ordered list, dealt as the lead; seed:295016a3a11c71f4. Signature interaction: the typeable staff and the playhead that carries the page. Motion grammar: playhead sweep, scrub, ease out from visible defaults.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Revision 3 (owner direction; supersedes Revision 2 where they differ)

Section order: Rest (dark hero), Hands, Reading, World, Score (contact sheet), Practise, Games (dark), Grow (ranks), Technique, Tempo, Begin (dark).

- Hero: the typeable staff and the lit-finger link to the hands are removed. The hero is a dark band with the dither, headline, lede, facts, Get started and, on the right, the Orbital Type (OrbitalType.tsx): logo mark in the centre, outer ring Altera 30px "sqwer · learn to type with every finger · ..." (60s), inner ring Geist Mono 15px accent "a s d f · j k l ; · home row · 5 4 3 2 ..." (90s, reverse); static under reduced motion. The Staff/Phrase grammar remains in the contact sheet, the close and the keyboard figure.
- Rising Ink (RisingInk.tsx): every section heading is a 15% ghost with an identical copy clipped from the baseline that rises as it scrolls in (scrub 0.8, top 92% to top 55%); fully inked without JS or under reduced motion.
- Score is a Contact Sheet (ContactSheet.tsx): four Film Black (#070914) strips, three frames each, grease-pencil ellipse and "Start here" on frame 1, summaries on hover or focus; replaces the chapter grid.
- World (World.tsx): pinned about 3.1 viewport heights; a circle opens from the middle of the light page onto a dark dither world with four rotating rings of type (the four parts) and a note per part, then closes. Plain dark band under 700px or reduced motion.
- Reading is short and continuous: pinned max(1000, 5 x characters) px (about 1100px), scrub 1.1, soft four-character fade, caret and line move by fractions.
- Games (GamePreview.tsx, games.css): previews ported from the stable Svelte page on near-black cards (#121212, 1px #262626) in a dark band, 3 columns (2 below 1024px, 1 below 640px), recoloured with the accent.
- Dither: WebGL context released only when the canvas leaves the page, so a React dev remount no longer blanks it.
- Unchanged: rank emblems, dark hero and close with dither, vertical page, earlier recorded exceptions.

Status, not a design rule: the three React Bits starter components named in Revision 2 (contact-sheet, orbital-type, rising-ink) need the Pro licence and are not yet vendored. ContactSheet, OrbitalType and RisingInk are in-house stand-ins named after them, to be replaced by the vendored originals.
