"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Youtube,
  Link,
  X,
  Loader,
  Check,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
}

interface YouTubeVideoPickerProps {
  userId: Id<"users">;
  sessionToken: string;
  value: string | undefined;
  onChange: (videoId: string | undefined) => void;
}

// Extract video ID from various YouTube URL formats
function extractVideoId(input: string): string | null {
  if (!input) return null;

  // If it's already just a video ID (11 characters, alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
    return input.trim();
  }

  // Try to parse as URL
  try {
    const url = new URL(input);

    // youtube.com/watch?v=VIDEO_ID
    if (url.hostname.includes("youtube.com") && url.searchParams.has("v")) {
      return url.searchParams.get("v");
    }

    // youtu.be/VIDEO_ID
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1);
    }

    // youtube.com/embed/VIDEO_ID
    if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/embed/")[1]?.split("?")[0];
    }

    // youtube.com/v/VIDEO_ID
    if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/v/")) {
      return url.pathname.split("/v/")[1]?.split("?")[0];
    }
  } catch {
    // Not a valid URL
  }

  return null;
}

export function YouTubeVideoPicker({
  userId,
  sessionToken,
  value,
  onChange,
}: YouTubeVideoPickerProps) {
  const [mode, setMode] = useState<"url" | "picker">("url");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  // Check if user has YouTube connected
  const youtubeConnection = useQuery(api.socialConnections.getByUserPlatform, {
    userId,
    platform: "youtube",
  });

  const isConnected = !!youtubeConnection;

  // Load videos when picker mode is selected
  useEffect(() => {
    if (mode === "picker" && isConnected && videos.length === 0 && !isLoadingVideos) {
      loadVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isConnected]);

  const loadVideos = async () => {
    setIsLoadingVideos(true);
    setVideosError(null);

    try {
      const response = await fetch("/api/youtube/videos", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to load videos");
      }

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error("Failed to load videos:", err);
      setVideosError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleUrlSubmit = () => {
    const videoId = extractVideoId(urlInput);
    if (videoId) {
      onChange(videoId);
      setUrlError(null);
    } else {
      setUrlError("Invalid YouTube URL or video ID");
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    setUrlInput("");
  };

  // If a video is already selected, show preview
  if (value) {
    return (
      <div className="card" style={{ padding: "var(--space-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-md)" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <Youtube size={20} style={{ color: "#FF0000" }} />
            Video Showcase
          </h3>
          <button
            type="button"
            onClick={handleRemove}
            className="btn btn-secondary"
            style={{ padding: "var(--space-xs) var(--space-sm)" }}
          >
            <X size={16} />
            Remove
          </button>
        </div>

        {/* Video Preview */}
        <div
          style={{
            position: "relative",
            paddingBottom: "56.25%",
            height: 0,
            overflow: "hidden",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-deep)",
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${value}`}
            title="YouTube video preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>

        <a
          href={`https://youtube.com/watch?v=${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            marginTop: "var(--space-sm)",
            fontSize: "0.875rem",
          }}
        >
          <ExternalLink size={14} />
          Open on YouTube
        </a>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "var(--space-lg)" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
        <Youtube size={20} style={{ color: "#FF0000" }} />
        Video Showcase
        <span className="text-muted" style={{ fontWeight: 400, fontSize: "0.875rem" }}>(optional)</span>
      </h3>
      <p className="text-secondary" style={{ marginBottom: "var(--space-lg)", fontSize: "0.875rem" }}>
        Add a YouTube video to showcase your design in action.
      </p>

      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: "var(--space-xs)", marginBottom: "var(--space-lg)" }}>
        <button
          type="button"
          onClick={() => setMode("url")}
          className="btn"
          style={{
            flex: 1,
            background: mode === "url" ? "var(--accent)" : "var(--bg-elevated)",
            color: mode === "url" ? "var(--bg-deep)" : "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <Link size={16} />
          Paste URL
        </button>
        <button
          type="button"
          onClick={() => setMode("picker")}
          disabled={!isConnected}
          className="btn"
          style={{
            flex: 1,
            background: mode === "picker" ? "var(--accent)" : "var(--bg-elevated)",
            color: mode === "picker" ? "var(--bg-deep)" : isConnected ? "var(--text-secondary)" : "var(--text-muted)",
            border: "1px solid var(--border)",
            cursor: isConnected ? "pointer" : "not-allowed",
          }}
          title={!isConnected ? "Connect YouTube in Settings to use this feature" : undefined}
        >
          <Youtube size={16} />
          My Videos
          {!isConnected && (
            <span style={{ fontSize: "0.75rem", marginLeft: "4px" }}>(not connected)</span>
          )}
        </button>
      </div>

      {/* URL Input Mode */}
      {mode === "url" && (
        <div>
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://youtube.com/watch?v=... or video ID"
              className="input"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="btn btn-primary"
              disabled={!urlInput.trim()}
            >
              <Check size={18} />
            </button>
          </div>
          {urlError && (
            <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "var(--space-xs)", display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertCircle size={14} />
              {urlError}
            </p>
          )}
        </div>
      )}

      {/* Video Picker Mode */}
      {mode === "picker" && isConnected && (
        <div>
          {isLoadingVideos ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-xl)" }}>
              <Loader size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : videosError ? (
            <div style={{ textAlign: "center", padding: "var(--space-lg)" }}>
              <AlertCircle size={32} style={{ color: "#ef4444", marginBottom: "var(--space-sm)" }} />
              <p style={{ color: "#ef4444", marginBottom: "var(--space-md)" }}>{videosError}</p>
              <button type="button" onClick={loadVideos} className="btn btn-secondary">
                Try Again
              </button>
            </div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--space-lg)" }}>
              <Youtube size={32} style={{ color: "var(--text-muted)", marginBottom: "var(--space-sm)" }} />
              <p className="text-muted">No videos found on your channel</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "var(--space-md)",
                maxHeight: 400,
                overflowY: "auto",
                padding: "var(--space-xs)",
              }}
            >
              {videos.map((video) => (
                <button
                  key={video.videoId}
                  type="button"
                  onClick={() => onChange(video.videoId)}
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    style={{
                      width: "100%",
                      aspectRatio: "16/9",
                      objectFit: "cover",
                    }}
                  />
                  <div style={{ padding: "var(--space-sm)" }}>
                    <p
                      style={{
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {video.title}
                    </p>
                    <p className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
