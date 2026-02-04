import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { execSync } from "child_process";
import path from "path";
import pkg from "./package.json" with { type: "json" };

function safeGitSha() {
  try { return execSync("git rev-parse --short HEAD").toString().trim(); }
  catch { return "local"; }
}

export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: { "/api": "http://localhost:8787" } // must match your API port
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_SHA__: JSON.stringify(safeGitSha()),
  },
});
