---
version: 1
slug: "src-app-lab-directions-fingering-page-tsx"
primary_target: "src/app/lab/directions/fingering/page.tsx"
related_targets: []
---

# Surface brief: landing direction "Fingering"

Scope: the new sqwer landing page, built in the lab at /lab/directions/fingering. Mode: Persuade.
Audience: beginners learning alone and pupils sent by a teacher; self-taught typists second.
Action: Get started (choose your level), linked from every viewport; it opens the current /start flow (placeholder until wired).
Proof and content: the real course (src/content/course.json): 4 parts, 12 chapters, 125 lessons, step kinds, 10 ranks, 11 leagues, 8 examinations; the six games; the finger map; three principles. Live database figures appear only as marked placeholders.
Constraints: PRODUCT.md; formal British copy; no eyebrow labels above headings; reduced motion respected; works without a pointer.
Chosen sketch: .impeccable/mocks/decision/sketch-fingering.html. Critique reference: the decision page round 3.
Build path: code-led for this surface. The recorded default (.impeccable/config.json) stays comp; round 3 ran code-led because OpenArt credits were exhausted (4 left, 6 needed per comp), so no comp round ran and no comp is approved. The user picked the sketch on that basis.

## Direction contract

THESIS: Typing taught as notation. Every letter wears its finger number, set like a piano étude, so the page teaches technique while it persuades. It refuses the keyboard hero over three feature cards, and it refuses dressing up as a concert hall: staves, numerals and tempo are working grammar, never ornament.

OWN-WORLD: Porcelain paper and ink, one ultramarine for the action and the playhead. Five-line staves in hairline grey carry all typed text in Geist Mono; finger numerals 1 to 5 in the five finger colours sit above each letter; PP Altera Serif sets titles like engraved score headings; PP Neue Montreal for prose. Tempo markings carry speeds (Andante, 30 WPM). Bar lines divide hands, chapters and sections. A soft wash of the five finger colours, the chord, is the only gradient.

STORY: In seconds the visitor sees that sqwer teaches which finger to use for each key, starting with F and J, along one clear score of twelve chapters. They believe it is calm, serious and free. They press Get started.

FIRST VIEWPORT: Navigation across the top (wordmark, Learn, Practice, Ranked, Sign in, Get started). Serif headline top left at display size, two lines. A full-width staff at mid-height carrying the home row, a s d f | j k l ;, each letter numbered in its finger colour; it is live: typing the keys lights each numeral and moves the playhead. Get started in ultramarine at the lower left with "Begin with F and J, about four minutes".

FORM: Grounded candidate 2 of 7 (piano method fingering notation), chosen by the user from the safer hand. seed:b2b21a5ef5a16abc. Signature interaction: the typeable staff in the first viewport. Motion grammar: a playhead that sweeps left to right; the course score pins and scrolls sideways under a scrubbed playhead; entrances ease out from visible defaults.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Live figures from the database are placeholders until the site is wired.
- Finger numbers use the piano convention per hand (thumb 1 to little finger 5); the finger map's keyboard shortcuts (1 to 0) are unchanged in the app.
