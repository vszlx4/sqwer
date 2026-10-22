# sqwer site (new design)

The new sqwer design, built separately from the current site (`apps/web`) and starting with the landing page.
Links to parts of sqwer that are not rebuilt yet are placeholders, listed in `src/lib/links.ts` with `wired: false`.

Next.js 16 (App Router), React 19, Tailwind CSS v4, GSAP, React Bits and Lenis.

## Run

From the repository root:

```sh
npm install            # once, installs every workspace
npm run dev:site       # development server with hot reload: http://localhost:3100
npm run build:site     # production build
npm run start:site     # serve the production build: http://localhost:3100
```

Inside `apps/site` the same scripts are `npm run dev`, `build`, `start`, plus:

```sh
npm run check          # type check (generates Next.js route types first)
npm run lint           # ESLint
```

Port 3100 keeps it apart from the current site (`npm run dev` on 5173, `npm start` on 3000), so both can run at once.

## Pages

| Route | What it is |
| --- | --- |
| `/` | The new landing page |
| `/foundations` | The current design guide (docs/design) rendered on the new stack: colour, type, actions, shape, motion |
| `/lab` | Atlas, the design exploration lab: home and map |
| `/lab/styles`, `/lab/styles/[id]` | 35 complete design worlds, rendered live; full-size view with identity sheet |
| `/lab/blueprints`, `/lab/blueprints/[id]` | 10 page types (landing, portfolio, editorial, course, product, store, agency, restaurant, event, docs) |
| `/lab/components` | Buttons, inputs, cards, navigation, menus, tabs, dialogs, tables, loaders, pointer effects |
| `/lab/typography` | 28 pairings, scale generator, Roboto Flex axes, type tester, text effects, editorial specimens |
| `/lab/colour` | 47 palettes in light and dark, generator, contrast matrix, harmonies |
| `/lab/backgrounds` | 38 backgrounds (28 CSS/SVG, 10 shader or canvas) |
| `/lab/motion` | Reveals, hovers, easing editor, scroll-driven demos, morphing, loaders, React Bits text |
| `/lab/assets` | 16 procedural illustrators, 36 icons, ornaments, image treatments, textures |
| `/lab/layouts` | 15 hero compositions, 8 section layouts, grid playground |
| `/lab/mixer` | Design mixer: 27 dimensions, locks, randomise, surprise, compare, tokens, CSS, JSON |
| `/lab/workbench` | Tune one design on any blueprint |
| `/lab/saved` | Library, collections, favourites, compare table, export and import |
| `/lab/directions/fingering` | The chosen landing direction (kept from the earlier lab) |

The lab ("Atlas") lives in `src/app/lab`: `_engine` (spec, palettes, fonts, worlds, mixing, tokens, store), `_ui` (renderer
`dp/`, art, backdrops, studio, lab pages) and `lab.css` for its own chrome. Everything is driven by one `DesignSpec`,
stored in `localStorage['atlas:v1']`. It does not touch `apps/web`.

The bar in the bottom-right corner (`WorkspaceBar`) switches page, palette and theme while designing; remove it before
launch.

## Design system

`DESIGN.md` records the built design system (tokens, type, components, motion, rules) and `PRODUCT.md` the product truth;
both are maintained with the Impeccable skill. Supporting, finger and rank colours live in `src/lib/system.ts`.
The course data shown on pages comes from `src/content/course.json`, regenerated from the current site with
`npm run content -w site`.

## Palettes

A palette sets the core tokens (`accent`, `on-accent`, `bg`, `surface`, `surface-2`, `line`, `line-strong`, `ink`,
`ink-2`, `ink-3`, `untyped`) for light and dark, and combines with the theme. They are defined once in
`src/lib/palettes.ts` (Ultramarine, the chosen palette and the default; Lime, Ember, Moss, Orchid and Mono stay for comparison) and
applied as `data-palette` on `<html>` before first paint, stored in `localStorage['sqwer:palette']`.

- In CSS and Tailwind, keep using the tokens (`bg-accent`, `text-ink-2`, `var(--line)`): they switch automatically.
- Components that need real colour values (WebGL shaders, canvas) take them from `useTokens()` in `src/lib/useTokens.ts`,
  which re-renders on palette, theme or system change. `accentInk(t)` gives an accent that is readable on the page
  background (lime on cream is not).
- `Scope` (`src/components/lab/Scope.tsx`) forces light or dark inside one element, in the current palette.
- To add a palette, add an entry to `PALETTES` and check it on `/lab/palettes`: text pairs need 4.5:1, the accent 3:1.
The site is marked `noindex` until it replaces `apps/web`.

## Structure

| Path | What it is |
| --- | --- |
| `src/app` | Routes, root layout, `globals.css` (tokens, copied from `apps/web/src/app.css`), `fonts.ts` |
| `src/fonts` | Self-hosted PP Altera Serif, PP Neue Montreal and Geist Mono |
| `src/components/reactbits` | 86 components added from React Bits; ours to adapt once added |
| `src/components/lab` | Lab building blocks: `Specimen`, `Scope`, the palette-aware `backgrounds`, direction copy |
| `src/components/motion` | GSAP building blocks (`Reveal`, `EaseDemo`) |
| `src/components/providers` | `SmoothScroll` (Lenis driven by GSAP's ticker, synced with ScrollTrigger) |
| `src/components/brand`, `ui`, `site` | Logo, buttons, site chrome |
| `src/lib` | `motion.ts` (GSAP plugins and named eases), `theme.ts`, `palettes.ts`, `useTokens.ts`, `contrast.ts`, `links.ts` |
| `public/lab` | Original SVG artwork for image-based components (no remote images) |

## Libraries

- **GSAP**: import `gsap`, `ScrollTrigger`, `SplitText` and `useGSAP` from `@/lib/motion`, which registers the plugins
  and the easing names from MOTION.md (`out-expo`, `out-soft`, `out-pop`, `spring`, `spring-soft`, `in-quick`). Wrap
  animations in `gsap.matchMedia()` with `MEDIA.motion`, so reduced motion turns them off.
- **React Bits**: from `apps/site`, run `npx shadcn@latest add @react-bits/<Name>-TS-TW` (TypeScript and Tailwind
  variant; several names at once is fine). The registry is set in `components.json`; files land in
  `src/components/reactbits`, and the CLI adds any npm packages they need (`motion`, `@hugeicons/*`). Then:
  - read the component's props before using it; colours are usually hex strings, so pass `useTokens()` values;
  - check it for remote URLs (`grep https:// file.tsx`) and self-host anything it would fetch;
  - give WebGL backgrounds a sized parent; they pause when off screen, so several per page are fine.

  Local changes to vendored files, to keep when a component is updated from the registry:
  - `VariableProximity`, `TextPressure`: no Google Fonts import (Roboto Flex is self-hosted in `globals.css`).
  - `RotatingText`: seeded shuffle instead of `Math.random()` during render, which fails the Next.js prerender.
  - 19 components (Aurora, Beams, DarkVeil, Dither, Grainient, Iridescence, LetterGlitch, Orb, Particles, Plasma,
    RippleGrid, Silk, Threads, Waves, ElasticSlider, Folder, FuzzyText, PixelCard, SpecularButton): colours are
    parsed in code first (`reactbits/colour.ts`) and only fall back to reading a canvas pixel. Browsers with
    fingerprinting protection (Zen, Firefox, Brave) blank that read-back, which made most backgrounds invisible.
  - ESLint relaxes the React Compiler rules for this folder only (`eslint.config.mjs`).

  Text components hide their text until JavaScript runs; fix that before launch.
- **Lenis**: already active on every page. Give inner scroll areas (menus, dialogs, wide tables) the attribute
  `data-lenis-prevent` so they scroll on their own.
