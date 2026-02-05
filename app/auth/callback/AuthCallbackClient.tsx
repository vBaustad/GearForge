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
    const code = searchParams?.get("code");
    const state = searchParams?.get("state");
    const storedState = sessionStorage.getItem("oauth_state");

    // Verify state parameter for CSRF protection
    if (state !== storedState) {
      setError("Invalid state parameter. Please try logging in again.");
      return;
    }

    if (!code) {
      setError("No authorization code received. Please try logging in again.");
      return;
    }

    // Clear state
    sessionStorage.removeItem("oauth_state");

    // Exchange code for session
    handleOAuthCallback(code)
      .then(() => {
        router.push("/");
      })
      .catch((err) => {
        console.error("OAuth callback error:", err);
        setError("Failed to complete login. Please try again.");
      });
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
