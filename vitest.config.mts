import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@data": path.resolve(import.meta.dirname, "data"),
      "server-only": path.resolve(import.meta.dirname, "tests/unit/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    restoreMocks: true,
  },
});
