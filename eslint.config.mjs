import path from "node:path";
import { fileURLToPath } from "node:url";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import unusedImports from "eslint-plugin-unused-imports";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      ".vercel/**",
      "coverage/**",
      "prisma/scripts/**",
      "public/**",
    ],
  },
  ...nextCoreWebVitals,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "unused-imports": unusedImports,
    },
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.test.json"],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "**/page.tsx",
      "**/layout.tsx",
      "**/loading.tsx",
      "**/error.tsx",
      "**/global-error.tsx",
      "**/not-found.tsx",
      "**/template.tsx",
      "**/default.tsx",
      "**/manifest.ts",
      "src/auth.config.ts",
      "tailwind.config.ts",
      "vitest.config.ts",
    ],
    rules: {
      // Prefer named exports (AGENTS.md §9).
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message:
            "Prefer named exports. Default exports are only allowed in Next.js route entry files, manifest.ts, and src/auth.config.ts (see AGENTS.md §9).",
        },
      ],
    },
  },
  {
    files: [
      "test/**/*.ts",
      "test/**/*.tsx",
      "**/*.test.ts",
      "**/*.spec.ts",
    ],
    rules: {
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
