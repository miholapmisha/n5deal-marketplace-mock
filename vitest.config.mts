import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Unit tests (SPEC §10): pure rules and parsers, no database, no browser. Playwright covers
// the flows end to end (playwright.config.ts).
export default defineConfig({
  resolve: {
    alias: {
      "@": fromRoot("./src"),
      // `server-only` throws unless bundled for React Server Components; tests are plain
      // Node, so it resolves to the package's own no-op build.
      "server-only": fromRoot("./node_modules/server-only/empty.js"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // Fresh mocks and globals for every test: call history, implementations, `fetch`.
    mockReset: true,
    unstubGlobals: true,
  },
});
