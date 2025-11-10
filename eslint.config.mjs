import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".vercel/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      "**/*.config.{js,mjs,ts}",
    ],
  },
  {
    rules: {
      // Allow eslint-disable comments for Prisma client types that aren't generated yet
      "@typescript-eslint/no-explicit-any": ["error", {
        "ignoreRestArgs": false,
        "fixToUnknown": false
      }],
      // Allow unused vars prefixed with underscore
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "prefer-const": "warn"
    }
  }
];

export default eslintConfig;
