import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // 1. Start with the recommended base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 2. Add your custom overrides at the end
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-require-imports": "off",
      "prefer-const": "warn",
    },
  },
);
