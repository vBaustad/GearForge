import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [_isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution (React strict mode or re-renders)
    if (hasProcessed.current) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`Login failed: ${errorParam}`);
      setIsProcessing(false);
      return;
    }

    if (!code) {
      setError("No authorization code received");
      setIsProcessing(false);
      return;
    }

    // Verify state to prevent CSRF
    const savedState = sessionStorage.getItem("oauth_state");
    if (state !== savedState) {
      setError("Invalid state parameter. Please try logging in again.");
      setIsProcessing(false);
      return;
    }

    // Mark as processed before async operation
    hasProcessed.current = true;

    // Clear state
    sessionStorage.removeItem("oauth_state");

    // Process the OAuth callback
    handleOAuthCallback(code)
      .then(() => {
        // Redirect to home or the page they were trying to access
        const returnTo = sessionStorage.getItem("auth_return_to") || "/";
        sessionStorage.removeItem("auth_return_to");
        navigate(returnTo, { replace: true });
      })
      .catch((err) => {
        console.error("OAuth callback error:", err);
        setError("Failed to complete login. Please try again.");
        setIsProcessing(false);
        hasProcessed.current = false; // Allow retry
      });
  }, []); // Empty deps - only run once on mount

  if (error) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)', color: '#f87171' }}>
            Login Failed
          </h1>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)' }}>
            {error}
          </p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <div className="placeholder-page">
        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto var(--space-lg)' }} />
        <h1 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>
          Logging you in...
        </h1>
        <p className="text-secondary">
          Please wait while we complete your Battle.net login.
        </p>
      </div>
    </div>
  );
}
