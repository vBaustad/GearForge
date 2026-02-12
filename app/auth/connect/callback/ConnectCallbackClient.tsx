"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Loader, CheckCircle, XCircle } from "lucide-react";

type ConnectionData = {
  platform: "twitch" | "youtube" | "kick";
  platformId: string;
  platformUsername: string;
  platformAvatarUrl?: string;
  channelUrl: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  state: string;
};

export function ConnectCallbackClient() {
  const router = useRouter();
  const connect = useMutation(api.socialConnections.connect);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  const handledRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent double execution
      if (handledRef.current) return;
      handledRef.current = true;

      // Fetch connection data from secure httpOnly cookie via API
      let connectionData: ConnectionData;
      try {
        const response = await fetch("/api/auth/connect/data", {
          credentials: "include",
        });

        if (!response.ok) {
          setStatus("error");
          setMessage("Missing connection data. Please try again.");
          return;
        }

        const result = await response.json();
        connectionData = result.data;
      } catch {
        setStatus("error");
        setMessage("Failed to retrieve connection data. Please try again.");
        return;
      }

      setPlatform(connectionData.platform);

      // Verify state parameter for CSRF protection (STRICT validation)
      const storedState = sessionStorage.getItem(`oauth_connect_state_${connectionData.platform}`);

      // Strict state validation - both must exist and match
      if (!storedState || !connectionData.state || connectionData.state !== storedState) {
        setStatus("error");
        setMessage("Security check failed. Please try connecting again from the settings page.");
        return;
      }

      // Clear state to prevent reuse
      sessionStorage.removeItem(`oauth_connect_state_${connectionData.platform}`);

      // Get session token from httpOnly cookie via API
      let sessionToken: string;
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
        });
        const sessionData = await sessionResponse.json();
        if (!sessionData.token) {
          setStatus("error");
          setMessage("You must be logged in to connect accounts.");
          return;
        }
        sessionToken = sessionData.token;
      } catch {
        setStatus("error");
        setMessage("Failed to verify login. Please try again.");
        return;
      }

      try {
        await connect({
          sessionToken,
          platform: connectionData.platform,
          platformId: connectionData.platformId,
          platformUsername: connectionData.platformUsername,
          platformAvatarUrl: connectionData.platformAvatarUrl,
          channelUrl: connectionData.channelUrl,
          accessToken: connectionData.accessToken,
          refreshToken: connectionData.refreshToken,
          tokenExpiresAt: connectionData.tokenExpiresAt,
        });

        setStatus("success");
        setMessage(`Successfully connected your ${getPlatformName(connectionData.platform)} account!`);

        // Redirect after short delay
        setTimeout(() => {
          router.push("/settings?connected=" + connectionData.platform);
        }, 1500);
      } catch (err) {
        console.error("Connection error:", err);
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Failed to connect account. Please try again."
        );
      }
    };

    handleCallback();
  }, [connect, router]);

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "twitch":
        return "Twitch";
      case "youtube":
        return "YouTube";
      case "kick":
        return "Kick";
      default:
        return platform;
    }
  };

  if (status === "loading") {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <Loader
            size={32}
            className="animate-spin"
            style={{ color: "var(--accent)", marginBottom: "var(--space-lg)" }}
          />
          <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
            Connecting {platform ? getPlatformName(platform) : "Account"}...
          </h2>
          <p className="text-secondary">
            Please wait while we verify your account.
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <CheckCircle
            size={48}
            style={{ color: "var(--success)", marginBottom: "var(--space-lg)" }}
          />
          <h2 className="font-display" style={{ color: "var(--success)", marginBottom: "var(--space-md)" }}>
            Connected!
          </h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            {message}
          </p>
          <p className="text-tertiary text-sm">
            Redirecting to settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <div className="placeholder-page">
        <XCircle
          size={48}
          style={{ color: "var(--error)", marginBottom: "var(--space-lg)" }}
        />
        <h2 className="font-display" style={{ color: "var(--error)", marginBottom: "var(--space-md)" }}>
          Connection Failed
        </h2>
        <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
          {message}
        </p>
        <button onClick={() => router.push("/settings")} className="btn btn-primary">
          Return to Settings
        </button>
      </div>
    </div>
  );
}
