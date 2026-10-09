import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.unit.ts", "**/*.spec.unit.tsx"],
    exclude: ["node_modules/**", ".next/**", "e2e/**", "playwright-report/**", "test-results/**"],
  },
});
