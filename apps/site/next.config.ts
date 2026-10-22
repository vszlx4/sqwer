import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A separate build folder for checks (NEXT_DIST_DIR=.next-check), so a running server is never disturbed.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // Workspace packages ship TypeScript source (packages/*).
  transpilePackages: ['@sqwer/layouts'],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
