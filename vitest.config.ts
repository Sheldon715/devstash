import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: [
      "src/actions/**/*.test.ts",
      "src/lib/**/*.test.ts",
      "src/app/api/**/*.test.ts",
    ],
    exclude: [
      "src/components/**",
      "src/**/*.test.tsx",
      "node_modules/**",
      ".next/**",
    ],
    restoreMocks: true,
    clearMocks: true,
  },
});
