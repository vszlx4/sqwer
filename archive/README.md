# Archive

Work kept for reference. Nothing here is installed, built or tested by the root scripts: `archive/` is outside the
npm workspaces (`apps/*`, `packages/*`).

## site-lab

The Next.js exploration app (formerly `apps/site`), frozen as it stood on 2026-10-22:

- **Atlas**, the design lab (`src/app/lab`): 35 style worlds, 47 palettes, 10 page blueprints, the design mixer and
  workbench, and labs for components, type, colour, backgrounds, motion, assets and layouts.
- **Fingering**, the chosen landing direction (`src/app/lab/directions/fingering`), with `PRODUCT.md` and `DESIGN.md`.
- The Ultramarine palette system (`src/lib/palettes.ts`, `src/lib/system.ts`), GSAP and Lenis setup, and 86 React Bits
  components (`src/components/reactbits`) including the fix for browsers with fingerprinting protection.

To run it again, copy the folder to `apps/site`, restore its `package.json` scripts into the root, and run `npm install`
(its dependencies are Next.js 16, React 19, Tailwind 4, GSAP, Lenis and Motion). Port 3100.
