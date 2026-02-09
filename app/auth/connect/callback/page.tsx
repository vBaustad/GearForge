import { Suspense } from "react";
import { ConnectCallbackClient } from "./ConnectCallbackClient";
import { Loader } from "lucide-react";

export default function ConnectCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="container page-section">
          <div className="placeholder-page">
            <Loader
              size={32}
              className="animate-spin"
              style={{ color: "var(--accent)", marginBottom: "var(--space-lg)" }}
            />
            <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
              Connecting Account...
            </h2>
          </div>
        </div>
      }
    >
      <ConnectCallbackClient />
    </Suspense>
  );
}
