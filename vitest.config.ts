import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/console/commands/**",
        "src/console/Make.ts",
        "src/index.ts",
        "src/**/index.ts",
        "src/console/generators/**",
      ],
    },
  },
});
