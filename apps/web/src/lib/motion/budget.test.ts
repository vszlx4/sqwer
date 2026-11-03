import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { build, type Rolldown } from "vite";
import { describe, expect, it } from "vitest";

// GSAP and every plugin the app imports, minified and gzipped. 60.7 kB at 3.15 with CustomEase, ScrollTrigger, MorphSVGPlugin.
const BUDGET_KB = 64;

const SRC = join(import.meta.dirname, "../..");
const ENTRY = "\0gsap-budget";

/** Every gsap module specifier imported by app code (tests excluded). */
function gsapImports(): string[] {
  const found = new Set<string>();
  for (const file of readdirSync(SRC, { recursive: true, encoding: "utf8" })) {
    if (!/\.(ts|svelte)$/.test(file) || file.endsWith(".test.ts")) continue;
    for (const m of readFileSync(join(SRC, file), "utf8").matchAll(
      /from '(gsap(?:\/\w+)?)'/g,
    ))
      found.add(m[1]);
  }
  return [...found].sort();
}

describe("GSAP budget", () => {
  it(`stays under ${BUDGET_KB} kB gzip`, async () => {
    const modules = gsapImports();
    expect(modules).toContain("gsap");
    const result = (await build({
      configFile: false,
      logLevel: "silent",
      root: SRC,
      plugins: [
        {
          name: "gsap-budget",
          enforce: "pre",
          resolveId: (id) => (id.endsWith("gsap-budget") ? ENTRY : null),
          load: (id) =>
            id === ENTRY
              ? modules
                  .map((m, i) => `export * as m${i} from '${m}';`)
                  .join("\n")
              : null,
        },
      ],
      build: {
        write: false,
        minify: true,
        lib: { entry: "gsap-budget", formats: ["es"], fileName: "gsap" },
      },
    })) as Rolldown.RolldownOutput[];
    const code = result
      .flatMap((r) => r.output)
      .flatMap((c) => (c.type === "chunk" ? [c.code] : []))
      .join("\n");
    expect(gzipSync(code).length / 1000).toBeLessThan(BUDGET_KB);
  });
});
