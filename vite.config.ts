// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { execSync } from "child_process";
import pkg from "./package.json" assert { type: "json" };

// get the current git commit hash (short)
const commitHash = execSync("git rev-parse --short HEAD").toString().trim();

export default defineConfig({
  plugins: [react(), tailwind()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_SHA__: JSON.stringify(commitHash),
  },
});
