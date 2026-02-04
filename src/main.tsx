import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./lib/auth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <ConvexProvider client={convex}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConvexProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);
