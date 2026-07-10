import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    exclude: ["web/**", "functions/**", "node_modules/**", ".next/**"],
  },
});
