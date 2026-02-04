"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Upload, Image, X, Plus, AlertCircle, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/types/creation";
import { useAuth } from "@/lib/auth";
import { BlizzardLoginButton } from "@/components/BlizzardLoginButton";

export function UploadPageClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading, sessionToken } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("bedroom");
  const [importString, setImportString] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const createCreation = useMutation(api.creations.create);
  const generateUploadUrl = useMutation(api.creations.generateUploadUrl);

  // Debounce import string for duplicate check
  const [debouncedImportString, setDebouncedImportString] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedImportString(importString.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [importString]);

  // Check for duplicate import string
  const duplicateCheck = useQuery(
    api.creations.checkDuplicate,
    debouncedImportString.length > 50 ? { importString: debouncedImportString } : "skip"
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="container page-section">
        <div style={{ minHeight: "50vh" }} />
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
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
            Connect your Battle.net account to upload and share your housing designs.
          </p>
          <BlizzardLoginButton size="large" />
        </div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);

    // Generate previews
    const newPreviews = newImages.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
    setError(null);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sessionToken) {
      setError("You must be logged in to upload");
      return;
    }

    // Validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!importString.trim()) {
      setError("Import string is required");
      return;
    }
    if (images.length === 0) {
      setError("At least one image is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images to Convex storage
      const imageIds: string[] = [];

      for (const image of images) {
        const uploadUrl = await generateUploadUrl({ sessionToken });
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });

        if (!result.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await result.json();
        imageIds.push(storageId);
      }

      // Create the design with sessionToken (secured API)
      const creationId = await createCreation({
        sessionToken, // Session token for authentication
        title: title.trim(),
        description: description.trim() || undefined,
        importString: importString.trim(),
        imageIds: imageIds as Id<"_storage">[], // Type cast for Convex ID
        category,
        tags,
        items: [], // No item picker in this simplified version
      });

      // Show success message and redirect to the new design
      setUploadSuccess(creationId);
      setTimeout(() => {
        router.push(`/design/${creationId}`);
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - show briefly before redirect
  if (uploadSuccess) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <div className="empty-state-icon" style={{ background: "rgba(34, 197, 94, 0.15)" }}>
            <CheckCircle size={48} style={{ color: "#22c55e" }} />
          </div>
          <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
            Design Uploaded!
          </h2>
          <p className="text-secondary">
            Your design is now live. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-section">
      {/* Page Header */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "var(--space-sm)" }}>
          <Upload size={24} style={{ marginRight: "var(--space-sm)", verticalAlign: "middle" }} />
          Upload Design
        </h1>
        <p className="text-secondary">Share your housing creation with the community</p>
      </div>

      {/* Error/Warning Messages */}
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

      {duplicateCheck && (
        <div
          className="card"
          style={{
            padding: "var(--space-md)",
            marginBottom: "var(--space-lg)",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
            <AlertTriangle size={20} style={{ color: "#f59e0b" }} />
            <span style={{ color: "#f59e0b", fontWeight: 500 }}>This design may already exist</span>
          </div>
          <Link
            href={`/design/${duplicateCheck._id}`}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-md)",
              padding: "var(--space-sm)",
              textDecoration: "none",
            }}
          >
            {duplicateCheck.thumbnailUrl && (
              <img
                src={duplicateCheck.thumbnailUrl}
                alt={duplicateCheck.title}
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: "var(--radius)" }}
              />
            )}
            <div>
              <div style={{ fontWeight: 500 }}>{duplicateCheck.title}</div>
              <div className="text-muted" style={{ fontSize: "0.875rem" }}>by {duplicateCheck.creatorName}</div>
            </div>
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-xl)" }}>
          {/* LEFT COLUMN - Basic Info */}
          <div>
            <div className="card" style={{ padding: "var(--space-lg)" }}>
              <h3 style={{ marginBottom: "var(--space-lg)" }}>Basic Info</h3>

              <div style={{ marginBottom: "var(--space-md)" }}>
                <label htmlFor="title" style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}>
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

              <div style={{ marginBottom: "var(--space-md)" }}>
                <label htmlFor="category" style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}>
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

              <div style={{ marginBottom: "var(--space-md)" }}>
                <label htmlFor="description" style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your design..."
                  className="input"
                  rows={3}
                  maxLength={2000}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: "var(--space-md)" }}>
                <label htmlFor="importString" style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}>
                  Import String <span style={{ color: "var(--accent)" }}>*</span>
                </label>
                <input
                  id="importString"
                  type="text"
                  value={importString}
                  onChange={(e) => setImportString(e.target.value)}
                  placeholder="Paste your housing import string here..."
                  className="input"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}>
                  Tags
                </label>
                <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a tag..."
                    className="input"
                    style={{ flex: 1 }}
                    maxLength={30}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn btn-secondary"
                    disabled={!tagInput.trim() || tags.length >= 10}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)", marginTop: "var(--space-sm)" }}>
                    {tags.map((tag) => (
                      <span key={tag} className="badge badge-outline" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Images & Preview */}
          <div>
            {/* Preview Card */}
            <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
              <h3 style={{ marginBottom: "var(--space-md)" }}>Preview</h3>
              <div className="card" style={{ overflow: "hidden" }}>
                {imagePreviews.length > 0 ? (
                  <img
                    src={imagePreviews[0]}
                    alt="Design preview"
                    style={{ width: "100%", height: 200, objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: 200,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--surface-elevated)",
                      color: "var(--foreground-muted)",
                    }}
                  >
                    <Image size={32} />
                    <span style={{ marginTop: "var(--space-sm)" }}>Upload a screenshot</span>
                  </div>
                )}
                <div style={{ padding: "var(--space-md)" }}>
                  <h4 style={{ marginBottom: "var(--space-xs)" }}>
                    {title || "Your Design Title"}
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <span className="badge">{CATEGORY_LABELS[category]}</span>
                    {tags.length > 0 && (
                      <span className="text-muted" style={{ fontSize: "0.875rem" }}>{tags.length} tags</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Screenshots */}
            <div className="card" style={{ padding: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
              <h3 style={{ marginBottom: "var(--space-md)" }}>
                Screenshots <span style={{ color: "var(--accent)" }}>*</span>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-sm)" }}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} style={{ position: "relative" }}>
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: "var(--radius)" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.7)",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={12} />
                    </button>
                    {index === 0 && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 4,
                          left: 4,
                          fontSize: "0.625rem",
                          background: "var(--accent)",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        Thumbnail
                      </span>
                    )}
                  </div>
                ))}
                {images.length < 5 && (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 80,
                      border: "2px dashed var(--border)",
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                      color: "var(--foreground-muted)",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                    <Plus size={20} />
                    <span style={{ fontSize: "0.75rem" }}>{images.length}/5</span>
                  </label>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Uploading..."
              ) : (
                <>
                  <Upload size={18} /> Upload Design
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
