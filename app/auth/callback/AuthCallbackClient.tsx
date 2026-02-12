"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Loader } from "lucide-react";

export function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleOAuthCallback, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    // If already authenticated, redirect home
    if (isAuthenticated) {
      router.push("/");
      return;
    }

    const handleCallback = async () => {
      // Prevent double execution
      if (handledRef.current) return;

      const code = searchParams?.get("code");
      const state = searchParams?.get("state");
      const storedState = sessionStorage.getItem("oauth_state");

      // Debug logging
      console.log("OAuth callback - state from URL:", state);
      console.log("OAuth callback - stored state:", storedState);

      // If no code or state, this might be a stale page refresh - redirect home
      if (!code || !state) {
        router.push("/");
        return;
      }

      // Verify state parameter for CSRF protection
      if (!storedState) {
        // State was already consumed - this is likely a page refresh after login
        // Redirect home instead of showing an error
        router.push("/");
        return;
      }

      if (state !== storedState) {
        setError("Invalid state parameter. Please try logging in again.");
        return;
      }

      // Clear state immediately to prevent reuse
      sessionStorage.removeItem("oauth_state");
      handledRef.current = true;

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
  }, [searchParams, handleOAuthCallback, router, isAuthenticated]);

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
