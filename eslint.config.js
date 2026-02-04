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
      "convex/_generated/**",
      "src/_pages_old/**",
      "src/App.tsx",
      "src/main.tsx",
      "src/vite-env.d.ts",
    ],
  },
  {
    rules: {
      // Allow <img> for external images (Wowhead, Blizzard CDN)
      "@next/next/no-img-element": "warn",
    },
  },
];

export default eslintConfig;
