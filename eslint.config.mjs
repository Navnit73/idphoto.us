import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Next enables only a handful of jsx-a11y rules; turn on the full strict set (WCAG 2.2 AA work, see ACCESSIBILITY.md).
  // The plugin is already registered by eslint-config-next, so only rules are added here.
  {
    files: ["**/*.{jsx,tsx}"],
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      // Strict forbids ARIA widget roles on lists; the recommended options allow the listbox/option pattern.
      "jsx-a11y/no-noninteractive-element-to-interactive-role":
        jsxA11y.flatConfigs.recommended.rules["jsx-a11y/no-noninteractive-element-to-interactive-role"],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright output.
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
