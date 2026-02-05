"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import {
  User,
  Settings,
  Save,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Lock,
} from "lucide-react";

export function SettingsPageClient() {
  const { user, isLoading: authLoading, sessionToken } = useAuth();

  // Form state
  const [bio, setBio] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current profile data
  const profile = useQuery(
    api.users.getProfile,
    user ? { id: user.id } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);

  // Populate form with existing data when profile loads
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setTwitchUrl(profile.twitchUrl || "");
      setYoutubeUrl(profile.youtubeUrl || "");
    }
  }, [profile]);

  // Loading state
  if (authLoading) {
    return (
      <div className="container page-section">
        <div style={{ minHeight: "50vh" }} />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <div className="empty-state-icon">
            <Lock size={48} />
          </div>
          <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
            Login Required
          </h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            Please log in to access your settings.
          </p>
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionToken) {
      setError("Session expired. Please log in again.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        sessionToken,
        bio: bio.trim() || undefined,
        twitchUrl: twitchUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container page-section">
      {/* Page Header */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h1
          className="font-display"
          style={{
            fontSize: "2rem",
            marginBottom: "var(--space-sm)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}
        >
          <Settings size={28} />
          Settings
        </h1>
        <p className="text-secondary">Manage your profile and preferences</p>
      </div>

      {/* Success Message */}
      {success && (
        <div
          className="card"
          style={{
            padding: "var(--space-md)",
            marginBottom: "var(--space-lg)",
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}
        >
          <CheckCircle size={18} style={{ color: "#22c55e" }} />
          <span style={{ color: "#22c55e" }}>Profile updated successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="card"
          style={{
            padding: "var(--space-md)",
            marginBottom: "var(--space-lg)",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}
        >
          <AlertCircle size={18} style={{ color: "#ef4444" }} />
          <span style={{ color: "#ef4444" }}>{error}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--space-xl)" }}>
        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          {/* Profile Section */}
          <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
            <h2 style={{ marginBottom: "var(--space-lg)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <User size={20} />
              Profile
            </h2>

            {/* Bio */}
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <label
                htmlFor="bio"
                style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}
              >
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself and your housing designs..."
                className="input"
                rows={4}
                maxLength={500}
                style={{ width: "100%", resize: "vertical" }}
              />
              <div className="text-muted" style={{ fontSize: "0.875rem", marginTop: "var(--space-xs)" }}>
                {bio.length}/500 characters
              </div>
            </div>

            {/* Twitch */}
            <div style={{ marginBottom: "var(--space-md)" }}>
              <label
                htmlFor="twitch"
                style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}
              >
                Twitch
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="twitch"
                  type="text"
                  value={twitchUrl}
                  onChange={(e) => setTwitchUrl(e.target.value)}
                  placeholder="twitch.tv/username or just username"
                  className="input"
                  style={{ width: "100%", paddingRight: "2.5rem" }}
                />
                {twitchUrl && (
                  <a
                    href={twitchUrl.includes("twitch.tv") ? twitchUrl : `https://twitch.tv/${twitchUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--accent)",
                    }}
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>

            {/* YouTube */}
            <div style={{ marginBottom: "var(--space-md)" }}>
              <label
                htmlFor="youtube"
                style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}
              >
                YouTube
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="youtube"
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="youtube.com/@channel or just @channel"
                  className="input"
                  style={{ width: "100%", paddingRight: "2.5rem" }}
                />
                {youtubeUrl && (
                  <a
                    href={
                      youtubeUrl.includes("youtube.com") || youtubeUrl.includes("youtu.be")
                        ? youtubeUrl
                        : `https://youtube.com/@${youtubeUrl.replace("@", "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--accent)",
                    }}
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving}
            style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Sidebar - Profile Preview */}
        <div>
          <div className="card" style={{ padding: "var(--space-lg)" }}>
            <h3 style={{ marginBottom: "var(--space-md)" }}>Profile Preview</h3>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--surface-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={28} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>
                  {user.battleTag.split("#")[0]}
                </div>
                <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                  {profile?.creationCount || 0} designs
                </div>
              </div>
            </div>

            {bio && (
              <p className="text-secondary" style={{ fontSize: "0.875rem", marginBottom: "var(--space-md)" }}>
                {bio}
              </p>
            )}

            {(twitchUrl || youtubeUrl) && (
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                {twitchUrl && (
                  <span className="badge badge-outline">Twitch</span>
                )}
                {youtubeUrl && (
                  <span className="badge badge-outline">YouTube</span>
                )}
              </div>
            )}

            <Link
              href={`/user/${user.id}`}
              className="btn btn-secondary"
              style={{ width: "100%", marginTop: "var(--space-lg)" }}
            >
              View Public Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
