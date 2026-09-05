import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 45_000,
    hookTimeout: 45_000,
    fileParallelism: false,
    coverage: { provider: "v8", reporter: ["text", "html"] }
  }
});
