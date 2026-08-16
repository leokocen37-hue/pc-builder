import { defineConfig } from "@playwright/test";

// Minimal config for the configurator smoke test. Points at an already-
// running `npm run start` server (the same production-mode server every
// other verification step in this project uses) rather than managing its
// own webServer, so it can't mask a build-only bug behind `next dev`'s
// different (non-optimized, HMR-instrumented) runtime behavior.
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
});
