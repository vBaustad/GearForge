import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft, Save, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth";

// Twitch icon (simple SVG)
function TwitchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  );
}

// YouTube icon (simple SVG)
function YouTubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function EditProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [twitchUrl, setTwitchUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const profile = useQuery(
    api.users.getById,
    user ? { id: user.id as any } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);

  // Load existing values when profile loads
  useEffect(() => {
    if (profile) {
      setTwitchUrl(profile.twitchUrl || "");
      setYoutubeUrl(profile.youtubeUrl || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  // Redirect if not logged in
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="container page-section">
        <div className="card empty-state">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Login Required
          </h2>
          <p className="text-secondary">
            You must be logged in to edit your profile.
          </p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!user || isSaving) return;

    setIsSaving(true);
    try {
      await updateProfile({
        userId: user.id as any,
        twitchUrl: twitchUrl || undefined,
        youtubeUrl: youtubeUrl || undefined,
        bio: bio || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container page-section" style={{ maxWidth: '600px' }}>
      {/* Back link */}
      <Link to={user ? `/user/${user.id}` : "/browse"} className="back-link">
        <ArrowLeft size={16} />
        Back to Profile
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.5rem' }}>
          Edit Profile
        </h1>
        <p className="text-secondary">
          Add your social links so viewers can find more of your content.
        </p>
      </div>

      {/* Form */}
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        {/* Bio */}
        <div className="form-group">
          <label htmlFor="bio" className="form-label">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a bit about yourself..."
            className="input textarea"
            rows={3}
            maxLength={500}
          />
          <p className="form-hint">{bio.length}/500 characters</p>
        </div>

        {/* Twitch */}
        <div className="form-group">
          <label htmlFor="twitch" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TwitchIcon size={18} />
            Twitch
          </label>
          <input
            id="twitch"
            type="text"
            value={twitchUrl}
            onChange={(e) => setTwitchUrl(e.target.value)}
            placeholder="twitch.tv/username or just username"
            className="input"
          />
          <p className="form-hint">Your Twitch channel URL or username</p>
        </div>

        {/* YouTube */}
        <div className="form-group">
          <label htmlFor="youtube" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <YouTubeIcon size={18} />
            YouTube
          </label>
          <input
            id="youtube"
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="youtube.com/@handle or just @handle"
            className="input"
          />
          <p className="form-hint">Your YouTube channel URL or handle</p>
        </div>

        {/* Preview */}
        {(twitchUrl || youtubeUrl) && (
          <div style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
            <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-sm)' }}>
              Preview
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {twitchUrl && (
                <a
                  href={twitchUrl.includes("://") ? twitchUrl : `https://twitch.tv/${twitchUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  <TwitchIcon size={16} />
                  Twitch
                  <ExternalLink size={12} />
                </a>
              )}
              {youtubeUrl && (
                <a
                  href={youtubeUrl.includes("://") ? youtubeUrl : `https://youtube.com/@${youtubeUrl.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  <YouTubeIcon size={16} />
                  YouTube
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {saved ? (
            "Saved!"
          ) : isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
