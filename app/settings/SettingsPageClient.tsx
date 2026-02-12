"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { SocialConnections } from "@/components/SocialConnections";
import { TipLinksEdit } from "@/components/TipLinksEdit";
import { CharacterLink } from "@/components/CharacterLink";
import {
  User,
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  Lock,
  Link2,
  Trash2,
  Download,
  AlertTriangle,
  X,
  Shield,
  Swords,
} from "lucide-react";
import { bioSchema, validateInput } from "@/lib/validation";
import { getErrorMessage } from "@/lib/errorMessages";

type SettingsTab = "profile" | "wow" | "connections" | "account";

export function SettingsPageClient() {
  const { user, isLoading: authLoading, sessionToken, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Form state
  const [bio, setBio] = useState("");

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Fetch current profile data
  const profile = useQuery(
    api.users.getProfile,
    user ? { id: user.id } : "skip"
  );

  // Fetch social connections for preview
  const socialConnections = useQuery(
    api.socialConnections.getByUser,
    user ? { userId: user.id } : "skip"
  );

  // Fetch export data when requested
  const exportData = useQuery(
    api.users.exportData,
    sessionToken && isExporting ? { sessionToken } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);
  const deleteAccount = useMutation(api.users.deleteAccount);

  // Populate form with existing data when profile loads
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
    }
  }, [profile]);

  // Handle export data
  useEffect(() => {
    if (exportData && isExporting) {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gearforge-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
    }
  }, [exportData, isExporting]);

  // Check for connection success/error messages from OAuth callback
  useEffect(() => {
    const connected = searchParams?.get("connected");
    const errorParam = searchParams?.get("error");

    if (connected) {
      const platformNames: Record<string, string> = {
        twitch: "Twitch",
        youtube: "YouTube",
        kick: "Kick",
      };
      setConnectionSuccess(`${platformNames[connected] || connected} connected successfully!`);
      setActiveTab("connections");
      window.history.replaceState({}, "", "/settings");
      setTimeout(() => setConnectionSuccess(null), 5000);
    }

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        twitch_auth_denied: "Twitch authorization was denied",
        youtube_auth_denied: "YouTube authorization was denied",
        kick_auth_denied: "Kick authorization was denied",
        twitch_not_configured: "Twitch OAuth is not configured",
        youtube_not_configured: "YouTube OAuth is not configured",
        kick_not_configured: "Kick OAuth is not configured",
      };
      setError(errorMessages[errorParam] || `Connection error: ${errorParam}`);
      setActiveTab("connections");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

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

    // Validate bio with Zod
    const validation = validateInput(bioSchema, bio.trim() || undefined);
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        sessionToken,
        bio: validation.data,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
  };

  const handleDeleteAccount = async () => {
    if (!sessionToken) {
      setError("Session expired. Please log in again.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAccount({
        sessionToken,
        confirmBattleTag: deleteConfirmText,
      });

      // Log out and redirect
      logout();
      router.push("/?deleted=true");
    } catch (err) {
      console.error("Failed to delete account:", err);
      setError(getErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Public Profile", icon: <User size={18} /> },
    { id: "wow", label: "Character", icon: <Swords size={18} /> },
    { id: "connections", label: "Connections", icon: <Link2 size={18} /> },
    { id: "account", label: "Account", icon: <Shield size={18} /> },
  ];

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
        <p className="text-secondary">Manage your profile and account preferences</p>
      </div>

      {/* Success Message */}
      {(success || connectionSuccess) && (
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
          <span style={{ color: "#22c55e" }}>
            {connectionSuccess || "Profile updated successfully!"}
          </span>
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
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#ef4444",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-xs)",
          marginBottom: "var(--space-xl)",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "var(--space-xs)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              padding: "var(--space-sm) var(--space-md)",
              background: activeTab === tab.id ? "var(--accent)" : "transparent",
              color: activeTab === tab.id ? "var(--bg-deep)" : "var(--text-secondary)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.9375rem",
              transition: "all 0.15s ease",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--space-xl)" }}>
        <div>
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <>
              <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
                  <h2 style={{ marginBottom: "var(--space-lg)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <User size={20} />
                    Public Profile
                  </h2>

                  {/* Bio */}
                  <div>
                    <label
                      htmlFor="bio"
                      style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}
                    >
                      Bio
                    </label>
                    <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "var(--space-sm)" }}>
                      A brief description that appears on your public profile.
                    </p>
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
                </div>

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

              {/* Tip Links Section */}
              <div style={{ marginTop: "var(--space-xl)" }}>
                <TipLinksEdit
                  sessionToken={sessionToken || ""}
                  currentTipLinks={profile?.tipLinks}
                />
              </div>
            </>
          )}

          {/* WoW Tab */}
          {activeTab === "wow" && sessionToken && (
            <CharacterLink sessionToken={sessionToken} />
          )}

          {/* Connections Tab */}
          {activeTab === "connections" && sessionToken && (
            <SocialConnections userId={user.id} sessionToken={sessionToken} />
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
              {/* Export Data */}
              <div className="card" style={{ padding: "var(--space-lg)" }}>
                <h2 style={{ marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                  <Download size={20} />
                  Export Your Data
                </h2>
                <p className="text-secondary" style={{ marginBottom: "var(--space-lg)", fontSize: "0.9375rem" }}>
                  Download a copy of all your data including profile information, designs, and collections.
                </p>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="btn btn-secondary"
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}
                >
                  <Download size={18} />
                  {isExporting ? "Preparing..." : "Download Data"}
                </button>
              </div>

              {/* Delete Account */}
              <div
                className="card"
                style={{
                  padding: "var(--space-lg)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <h2
                  style={{
                    marginBottom: "var(--space-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-sm)",
                    color: "#ef4444",
                  }}
                >
                  <Trash2 size={20} />
                  Delete Account
                </h2>
                <p className="text-secondary" style={{ marginBottom: "var(--space-lg)", fontSize: "0.9375rem" }}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-xs)",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                  }}
                >
                  <Trash2 size={18} />
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Profile Preview */}
        <div>
          <div className="card" style={{ padding: "var(--space-lg)", position: "sticky", top: "calc(64px + var(--space-lg))" }}>
            <h3 style={{ marginBottom: "var(--space-md)" }}>Profile Preview</h3>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface-elevated)",
                  border: "2px solid var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.battleTag}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <User size={28} />
                )}
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

            {socialConnections && socialConnections.length > 0 && (
              <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", marginBottom: "var(--space-md)" }}>
                {socialConnections.map((conn) => (
                  <span
                    key={conn.platform}
                    className="badge"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background:
                        conn.platform === "twitch"
                          ? "rgba(145, 70, 255, 0.2)"
                          : conn.platform === "youtube"
                          ? "rgba(255, 0, 0, 0.2)"
                          : "rgba(83, 252, 24, 0.2)",
                      color:
                        conn.platform === "twitch"
                          ? "#9146FF"
                          : conn.platform === "youtube"
                          ? "#FF0000"
                          : "#53FC18",
                      border: "none",
                    }}
                  >
                    <CheckCircle size={12} />
                    {conn.platform.charAt(0).toUpperCase() + conn.platform.slice(1)}
                  </span>
                ))}
              </div>
            )}

            <Link
              href={`/user/${user.id}`}
              className="btn btn-secondary"
              style={{ width: "100%", textAlign: "center" }}
            >
              View Public Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-lg)",
          }}
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: 480,
              width: "100%",
              padding: "var(--space-xl)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={24} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.25rem", color: "#ef4444" }}>Delete Account</h2>
                <p className="text-muted" style={{ fontSize: "0.875rem" }}>This action cannot be undone</p>
              </div>
            </div>

            <p className="text-secondary" style={{ marginBottom: "var(--space-lg)", lineHeight: 1.6 }}>
              This will permanently delete:
            </p>
            <ul style={{ marginBottom: "var(--space-lg)", paddingLeft: "var(--space-lg)" }}>
              <li className="text-secondary" style={{ marginBottom: "var(--space-xs)" }}>Your profile and bio</li>
              <li className="text-secondary" style={{ marginBottom: "var(--space-xs)" }}>All your uploaded designs ({profile?.creationCount || 0})</li>
              <li className="text-secondary" style={{ marginBottom: "var(--space-xs)" }}>Your connected social accounts</li>
              <li className="text-secondary" style={{ marginBottom: "var(--space-xs)" }}>Your collections, likes, and saves</li>
            </ul>

            <label style={{ display: "block", marginBottom: "var(--space-sm)", fontWeight: 500 }}>
              Type <strong style={{ color: "var(--text-primary)" }}>{user.battleTag}</strong> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Enter your Battle.net tag"
              className="input"
              style={{ width: "100%", marginBottom: "var(--space-lg)" }}
              disabled={isDeleting}
            />

            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== user.battleTag || isDeleting}
                className="btn"
                style={{
                  flex: 1,
                  background: deleteConfirmText === user.battleTag ? "#ef4444" : "var(--bg-hover)",
                  borderColor: deleteConfirmText === user.battleTag ? "#ef4444" : "var(--border)",
                  color: deleteConfirmText === user.battleTag ? "white" : "var(--text-muted)",
                  cursor: deleteConfirmText === user.battleTag && !isDeleting ? "pointer" : "not-allowed",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
