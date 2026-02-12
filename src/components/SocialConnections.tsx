"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Link2, CheckCircle, ExternalLink, Loader } from "lucide-react";
import { useState } from "react";
import { getErrorMessage } from "@/lib/errorMessages";

type Platform = "twitch" | "youtube" | "kick";

interface SocialConnectionsProps {
  userId: Id<"users">;
  sessionToken: string;
}

const platformConfig: Record<
  Platform,
  {
    name: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
  }
> = {
  twitch: {
    name: "Twitch",
    color: "#9146FF",
    bgColor: "rgba(145, 70, 255, 0.1)",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
      </svg>
    ),
  },
  youtube: {
    name: "YouTube",
    color: "#FF0000",
    bgColor: "rgba(255, 0, 0, 0.1)",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  kick: {
    name: "Kick",
    color: "#53FC18",
    bgColor: "rgba(83, 252, 24, 0.1)",
    icon: (
      <svg viewBox="0 0 512 512" width="20" height="20" fill="currentColor">
        <path d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z" />
      </svg>
    ),
  },
};

export function SocialConnections({ userId, sessionToken }: SocialConnectionsProps) {
  const connections = useQuery(api.socialConnections.getByUser, { userId });
  const disconnect = useMutation(api.socialConnections.disconnect);
  const [disconnecting, setDisconnecting] = useState<Platform | null>(null);
  const [connecting, setConnecting] = useState<Platform | null>(null);

  const handleConnect = (platform: Platform) => {
    // Generate state token for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem(`oauth_connect_state_${platform}`, state);
    setConnecting(platform);

    // Redirect to OAuth initiation endpoint
    window.location.href = `/api/auth/connect/${platform}?state=${state}`;
  };

  const handleDisconnect = async (platform: Platform) => {
    if (!confirm(`Are you sure you want to disconnect your ${platformConfig[platform].name} account?`)) {
      return;
    }

    setDisconnecting(platform);
    try {
      await disconnect({ sessionToken, platform });
    } catch (err) {
      console.error("Failed to disconnect:", err);
      alert(getErrorMessage(err));
    } finally {
      setDisconnecting(null);
    }
  };

  const getConnection = (platform: Platform) => {
    return connections?.find((c) => c.platform === platform);
  };

  if (connections === undefined) {
    return (
      <div className="card" style={{ padding: "var(--space-lg)" }}>
        <h2 style={{ marginBottom: "var(--space-lg)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <Link2 size={20} />
          Connected Accounts
        </h2>
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-lg)" }}>
          <Loader size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "var(--space-lg)" }}>
      <h2 style={{ marginBottom: "var(--space-lg)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        <Link2 size={20} />
        Connected Accounts
      </h2>
      <p className="text-secondary" style={{ marginBottom: "var(--space-lg)", fontSize: "0.875rem" }}>
        Connect your streaming accounts to display verified badges on your profile.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        {(["twitch", "youtube", "kick"] as Platform[]).map((platform) => {
          const config = platformConfig[platform];
          const connection = getConnection(platform);
          const isDisconnecting = disconnecting === platform;
          const isConnecting = connecting === platform;

          return (
            <div
              key={platform}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-md)",
                background: connection ? config.bgColor : "var(--surface-elevated)",
                borderRadius: "var(--radius-md)",
                border: connection ? `1px solid ${config.color}30` : "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    background: config.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: config.color,
                  }}
                >
                  {config.icon}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                    <span style={{ fontWeight: 500 }}>{config.name}</span>
                    {connection && (
                      <CheckCircle size={14} style={{ color: "#22c55e" }} />
                    )}
                  </div>
                  {connection ? (
                    <a
                      href={connection.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary"
                      style={{
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-xs)",
                        textDecoration: "none",
                      }}
                    >
                      {connection.platformUsername}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                      Not connected
                    </span>
                  )}
                </div>
              </div>

              {connection ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleDisconnect(platform)}
                  disabled={isDisconnecting}
                  style={{ minWidth: 100 }}
                >
                  {isDisconnecting ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    "Disconnect"
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => handleConnect(platform)}
                  disabled={isConnecting}
                  style={{
                    minWidth: 100,
                    background: config.color,
                    borderColor: config.color,
                  }}
                >
                  {isConnecting ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    `Connect`
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
