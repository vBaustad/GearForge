"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@/lib/auth";
import { CATEGORY_LABELS, type Category, CATEGORIES } from "@/types/creation";
import { YouTubeVideoPicker } from "@/components/YouTubeVideoPicker";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Lock,
  Image as ImageIcon,
  X,
} from "lucide-react";

interface EditDesignPageClientProps {
  id: string;
}

export function EditDesignPageClient({ id }: EditDesignPageClientProps) {
  const router = useRouter();
  const { user, isLoading: authLoading, sessionToken } = useAuth();

  const design = useQuery(api.creations.getById, { id: id as Id<"creations"> });
  const updateDesign = useMutation(api.creations.update);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | undefined>();

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Populate form when design loads
  useEffect(() => {
    if (design) {
      setTitle(design.title);
      setDescription(design.description || "");
      setCategory(design.category as Category);
      setTags(design.tags || []);
      setYoutubeVideoId(design.youtubeVideoId);
    }
  }, [design]);

  // Loading state
  if (authLoading || design === undefined) {
    return (
      <div className="container page-section">
        <div style={{ minHeight: "50vh" }} />
      </div>
    );
  }

  // Design not found
  if (design === null) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
            Design Not Found
          </h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            This design may have been removed or doesn&apos;t exist.
          </p>
          <Link href="/browse" className="btn btn-primary">
            Browse Designs
          </Link>
        </div>
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
            Please log in to edit designs.
          </p>
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Not the owner
  if (design.creatorId !== user.id && user.role !== "admin" && user.role !== "moderator") {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <div className="empty-state-icon">
            <Lock size={48} />
          </div>
          <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
            Access Denied
          </h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            You can only edit your own designs.
          </p>
          <Link href={`/design/${id}`} className="btn btn-primary">
            View Design
          </Link>
        </div>
      </div>
    );
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionToken) {
      setError("Session expired. Please log in again.");
      return;
    }

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateDesign({
        id: id as Id<"creations">,
        sessionToken,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        tags,
        youtubeVideoId,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/design/${id}`);
      }, 1500);
    } catch (err) {
      console.error("Failed to update design:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (success) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <div className="empty-state-icon" style={{ background: "rgba(34, 197, 94, 0.15)" }}>
            <CheckCircle size={48} style={{ color: "#22c55e" }} />
          </div>
          <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
            Changes Saved!
          </h2>
          <p className="text-secondary">Redirecting to your design...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-section">
      {/* Back link */}
      <Link href={`/design/${id}`} className="design-back-link">
        <ArrowLeft size={18} />
        Back to Design
      </Link>

      {/* Page Header */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "var(--space-sm)" }}>
          Edit Design
        </h1>
        <p className="text-secondary">Update your housing design details</p>
      </div>

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
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: "var(--space-lg)" }}>
            {/* Title */}
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <label
                htmlFor="title"
                style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}
              >
                Title <span style={{ color: "var(--accent)" }}>*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Cozy Tavern Corner"
                className="input"
                maxLength={100}
                style={{ width: "100%" }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <label
                htmlFor="description"
                style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your design..."
                className="input"
                rows={4}
                maxLength={1000}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <label
                htmlFor="category"
                style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}
              >
                Category <span style={{ color: "var(--accent)" }}>*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="input"
                style={{ width: "100%" }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <label style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}>
                Tags (up to 5)
              </label>
              <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag..."
                  className="input"
                  style={{ flex: 1 }}
                  maxLength={20}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddTag}
                  disabled={tags.length >= 5}
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge badge-outline"
                      style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Note about import string */}
            <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "var(--space-lg)" }}>
              Note: The import string and images cannot be changed. If you need to update these, please delete this design and create a new one.
            </p>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* YouTube Video */}
          {sessionToken && (
            <div style={{ marginTop: "var(--space-lg)" }}>
              <YouTubeVideoPicker
                userId={user.id}
                sessionToken={sessionToken}
                value={youtubeVideoId}
                onChange={setYoutubeVideoId}
              />
            </div>
          )}
        </form>

        {/* Preview Sidebar */}
        <div>
          <div className="card" style={{ padding: "var(--space-lg)" }}>
            <h3 style={{ marginBottom: "var(--space-md)" }}>Preview</h3>

            {/* Thumbnail */}
            {design.imageUrls && design.imageUrls.length > 0 ? (
              <div
                style={{
                  aspectRatio: "16/9",
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                  marginBottom: "var(--space-md)",
                }}
              >
                <img
                  src={design.imageUrls[0]}
                  alt={title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <div
                style={{
                  aspectRatio: "16/9",
                  borderRadius: "var(--radius)",
                  background: "var(--surface-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "var(--space-md)",
                }}
              >
                <ImageIcon size={32} className="text-muted" />
              </div>
            )}

            <span className="badge" style={{ marginBottom: "var(--space-sm)" }}>
              {CATEGORY_LABELS[category]}
            </span>
            <h4 style={{ marginBottom: "var(--space-xs)" }}>{title || "Untitled"}</h4>
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>
              by {user.battleTag.split("#")[0]}
            </p>

            {tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)", marginTop: "var(--space-md)" }}>
                {tags.map((tag) => (
                  <span key={tag} className="badge badge-outline" style={{ fontSize: "0.75rem" }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
