import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { execSync } from "child_process";
import pkg from "./package.json" assert { type: "json" };
import type { Plugin } from "vite";
import express from "express";
import { api } from "./src/server/router";

function safeGitSha() {
  try { return execSync("git rev-parse --short HEAD").toString().trim(); }
  catch { return "local"; }
}

const apiPlugin: Plugin = {
  name: "gearforge-api",
  configureServer(server) {
    const app = express();
    app.use("/api", api);         // /api/* handled here
    server.middlewares.use(app);
  },
};

export default defineConfig({
  plugins: [react(), tailwind(), apiPlugin],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_SHA__: JSON.stringify(safeGitSha()),
  },
});
