// src/app/main.tsx
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./index.css";
import { inject } from "@vercel/analytics";

if (import.meta.env.PROD) inject();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>
);
