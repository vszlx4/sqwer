# sqwer, React rewrite

The second version of sqwer: Next.js 16 (App Router), React 19, Tailwind CSS v4, GSAP, Lenis and React Bits.
It lives on `v2/react-rewrite`; the stable SvelteKit site (`apps/web`) stays on `main` until this replaces it.

```sh
npm install              # once, from the repository root
npm run dev -w web-react # http://localhost:3100
npm run check -w web-react
npm run lint -w web-react
npm run build -w web-react
```

`PRODUCT.md` and `DESIGN.md` are the product and design records (kept with Impeccable). Course facts come from
`src/content/course.json`, regenerated from the current site with `npm run content -w web-react`.
Links to pages that are not rebuilt yet are placeholders in `src/lib/links.ts` (`wired: false`).

## Libraries

- **GSAP**: import `gsap`, `ScrollTrigger`, `SplitText`, `useGSAP` from `@/lib/motion` (plugins and the named eases
  registered once). Wrap animation in `gsap.matchMedia()` with `MEDIA.motion` so reduced motion turns it off.
- **React Bits**: `npx shadcn@latest add @react-bits/<Name>-TS-TW` from this folder (registry in `components.json`);
  files land in `src/components/reactbits`. Read a component's props and check it for remote URLs before using it.
- **Lenis**: active site-wide through `SmoothScroll`. Give inner scroll areas the attribute `data-lenis-prevent`.

## Local changes to React Bits files

- `Dither`: the WebGL context is only released when the canvas has left the page; React's dev-mode remount otherwise reused a lost context and the field stayed blank in `npm run dev`.
- `Dither`, and any component that reads a colour: colours are parsed in code (`reactbits/colour.ts`) so browsers with fingerprinting protection (Zen, Firefox, Brave) do not blank them.
