"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Loader } from "lucide-react";

export function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent double execution in React 18 strict mode
    let handled = false;

    const handleCallback = async () => {
      if (handled) return;

      const code = searchParams?.get("code");
      const state = searchParams?.get("state");
      const storedState = sessionStorage.getItem("oauth_state");

      // Debug logging
      console.log("OAuth callback - state from URL:", state);
      console.log("OAuth callback - stored state:", storedState);

      // Verify state parameter for CSRF protection
      if (!state || !storedState || state !== storedState) {
        // Only show error if we actually have a state mismatch (not just missing)
        if (state && storedState && state !== storedState) {
          setError("Invalid state parameter. Please try logging in again.");
        } else if (!storedState) {
          // State was already consumed or never set - might be a page refresh
          setError("Session expired. Please try logging in again.");
        }
        return;
      }

      if (!code) {
        setError("No authorization code received. Please try logging in again.");
        return;
      }

      // Clear state immediately to prevent reuse
      sessionStorage.removeItem("oauth_state");
      handled = true;

      // Exchange code for session
      try {
        await handleOAuthCallback(code);
        router.push("/");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Failed to complete login. Please try again.");
      }
    };

    handleCallback();
  }, [searchParams, handleOAuthCallback, router]);

  if (error) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <h2 className="font-display" style={{ color: "var(--accent)", marginBottom: "var(--space-md)" }}>
            Login Error
          </h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            {error}
          </p>
          <button onClick={() => router.push("/")} className="btn btn-primary">
            Return Home
          </button>
        </div>
      </div>
    );
  }

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
