import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/dist-types/**",
      "packages/mcp/bundle/**",
      "**/node_modules/**",
      "evals/results/**",
      "coverage/**"
    ]
  },
  {
    ...js.configs.recommended,
    files: ["**/*.js"],
    languageOptions: { globals: { ...globals.node } }
  },
  {
    files: ["fixtures/static/**/*.js"],
    languageOptions: { globals: { ...globals.browser } }
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"]
  })),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: [
          "./tsconfig.eslint.json",
          "./packages/*/tsconfig.json",
          "./fixtures/*/tsconfig.json"
        ],
        tsconfigRootDir: import.meta.dirname
      },
      globals: { ...globals.node }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error"
    }
  }
);
