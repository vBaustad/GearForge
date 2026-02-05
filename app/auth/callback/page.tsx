import { Suspense } from "react";
import { AuthCallbackClient } from "./AuthCallbackClient";
import { Loader } from "lucide-react";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackClient />
    </Suspense>
  );
}

function AuthCallbackLoading() {
  return (
    <div className="container page-section">
      <div className="placeholder-page">
        <Loader size={32} className="animate-spin" style={{ color: "var(--accent)", marginBottom: "var(--space-lg)" }} />
        <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
          Completing Login...
        </h2>
        <p className="text-secondary">
          Please wait while we verify your Battle.net account.
        </p>
      </div>
    </div>
  );
}
