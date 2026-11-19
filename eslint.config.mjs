import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Compiler advisory rules: the flagged code paths are browser-only detection effects,
    // Date.now() timing refs and a debounce ref, all verified by E2E tests. Kept visible as warnings.
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      // pg rows and JSON prompts are dynamically shaped; validated with zod at the boundaries.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "tmp/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
