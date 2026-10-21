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

The bar in the bottom-right corner (`WorkspaceBar`) switches page and theme while designing; remove it before launch.
The site is marked `noindex` until it replaces `apps/web`.

## Structure

| Path | What it is |
| --- | --- |
| `src/app` | Routes, root layout, `globals.css` (tokens, copied from `apps/web/src/app.css`), `fonts.ts` |
| `src/fonts` | Self-hosted PP Altera Serif, PP Neue Montreal and Geist Mono |
| `src/components/reactbits` | Components added from React Bits; ours to adapt once added |
| `src/components/motion` | GSAP building blocks (`Reveal`, `EaseDemo`) |
| `src/components/providers` | `SmoothScroll` (Lenis driven by GSAP's ticker, synced with ScrollTrigger) |
| `src/components/brand`, `ui`, `site` | Logo, buttons, site chrome |
| `src/lib` | `motion.ts` (GSAP plugins and named eases), `theme.ts`, `links.ts` |

## Libraries

- **GSAP**: import `gsap`, `ScrollTrigger`, `SplitText` and `useGSAP` from `@/lib/motion`, which registers the plugins
  and the easing names from MOTION.md (`out-expo`, `out-soft`, `out-pop`, `spring`, `spring-soft`, `in-quick`). Wrap
  animations in `gsap.matchMedia()` with `MEDIA.motion`, so reduced motion turns them off.
- **React Bits**: from `apps/site`, run `npx shadcn@latest add @react-bits/<Name>-TS-TW` (TypeScript and Tailwind
  variant). The registry is set in `components.json`; files land in `src/components/reactbits`. Note that React Bits
  text components hide their text until JavaScript runs; fix that before launch.
- **Lenis**: already active on every page. Give inner scroll areas (menus, dialogs, wide tables) the attribute
  `data-lenis-prevent` so they scroll on their own.
