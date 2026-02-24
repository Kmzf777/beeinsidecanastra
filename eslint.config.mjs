import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    // Tooling config files (CommonJS)
    "jest.config.js",
    "jest.setup.ts",
    // Next.js build artifacts
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // AIOS framework (not part of this app)
    ".aios-core/**",
    ".agent/**",
    ".antigravity/**",
    ".claude/**",
    "docs/**",
  ]),
]);

export default eslintConfig;
