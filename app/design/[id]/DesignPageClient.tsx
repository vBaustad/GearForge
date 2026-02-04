"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Heart, Eye, Copy, Check, ArrowLeft, User, ChevronLeft, ChevronRight, Bookmark, Flag, X, AlertCircle, Trash2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { CATEGORY_LABELS, type Category } from "@/types/creation";
import Script from "next/script";

interface DesignPageClientProps {
  id: string;
}

export function DesignPageClient({ id }: DesignPageClientProps) {
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<"inappropriate" | "spam" | "stolen" | "broken" | "other">("inappropriate");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const design = useQuery(api.creations.getById, { id: id as Id<"creations"> });
  const incrementViews = useMutation(api.creations.incrementViews);
  const toggleLike = useMutation(api.likes.toggle);
  const toggleSave = useMutation(api.saves.toggle);
  const submitReport = useMutation(api.reports.submit);
  const deleteDesign = useMutation(api.creations.remove);
  const { user, isAuthenticated, sessionToken } = useAuth();

  // Check if user has liked/saved/reported this design
  const hasLiked = useQuery(
    api.likes.hasLiked,
    user ? { userId: user.id, creationId: id as Id<"creations"> } : "skip"
  );
  const hasSaved = useQuery(
    api.saves.hasSaved,
    user ? { userId: user.id, creationId: id as Id<"creations"> } : "skip"
  );
  const hasReported = useQuery(
    api.reports.hasReported,
    user ? { userId: user.id, creationId: id as Id<"creations"> } : "skip"
  );

  // Increment views on mount
  useEffect(() => {
    if (design && id) {
      incrementViews({ id: id as Id<"creations"> });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCopyImportString = async () => {
    if (!design?.importString) return;

    try {
      await navigator.clipboard.writeText(design.importString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleToggleLike = async () => {
    if (!sessionToken || isLiking) return;
    setIsLiking(true);
    try {
      await toggleLike({
        sessionToken,
        creationId: id as Id<"creations">,
      });
    } catch (err) {
      console.error("Failed to toggle like:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleSave = async () => {
    if (!sessionToken || isSaving) return;
    setIsSaving(true);
    try {
      await toggleSave({
        sessionToken,
        creationId: id as Id<"creations">,
      });
    } catch (err) {
      console.error("Failed to toggle save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!sessionToken || isReporting) return;
    setIsReporting(true);
    setReportError(null);

    try {
      await submitReport({
        sessionToken,
        creationId: id as Id<"creations">,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportReason("inappropriate");
        setReportDetails("");
      }, 2000);
    } catch (err) {
      console.error("Failed to submit report:", err);
      setReportError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setIsReporting(false);
    }
  };

  const handleDeleteDesign = async () => {
    if (!sessionToken || isDeleting) return;
    setIsDeleting(true);

    try {
      await deleteDesign({
        id: id as Id<"creations">,
        sessionToken,
      });
      router.push("/browse");
    } catch (err) {
      console.error("Failed to delete design:", err);
      alert(err instanceof Error ? err.message : "Failed to delete design");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Check if current user is the owner
  const isOwner = user && design?.creatorId === user.id;

  if (design === undefined) {
    return (
      <div className="container page-section">
        <div style={{ minHeight: "50vh" }} />
      </div>
    );
  }

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

  const images = design.imageUrls || [];
  const hasMultipleImages = images.length > 1;

  // JSON-LD for this specific design (CreativeWork schema)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: design.title,
    description: design.description || `${CATEGORY_LABELS[design.category as Category]} housing design for World of Warcraft`,
    url: `https://gearforge.io/design/${id}`,
    image: images[0] || undefined,
    author: {
      "@type": "Person",
      name: design.creatorName,
      url: `https://gearforge.io/user/${design.creatorId}`,
    },
    datePublished: new Date(design._creationTime).toISOString(),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: design.likeCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ViewAction",
        userInteractionCount: design.viewCount,
      },
    ],
    keywords: [
      "WoW housing",
      CATEGORY_LABELS[design.category as Category],
      ...design.tags,
    ].join(", "),
  };

  return (
    <>
      <Script
        id="design-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container page-section">
      {/* Back link */}
      <Link href="/browse" className="design-back-link">
        <ArrowLeft size={18} />
        Back to Browse
      </Link>

      <div className="design-layout">
        {/* Left: Images */}
        <div className="design-images">
          {images.length > 0 ? (
            <div className="design-image-gallery">
              <div className="design-main-image">
                <img src={images[currentImageIndex]} alt={design.title} />
                {hasMultipleImages && (
                  <>
                    <button
                      className="gallery-nav gallery-nav-prev"
                      onClick={() => setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      className="gallery-nav gallery-nav-next"
                      onClick={() => setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
              {hasMultipleImages && (
                <div className="design-thumbnails">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      className={`design-thumbnail ${i === currentImageIndex ? "active" : ""}`}
                      onClick={() => setCurrentImageIndex(i)}
                    >
                      <img src={url} alt={`View ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="design-image-placeholder">
              <img src="/gearforge_logo_new.png" alt="" className="placeholder-logo" />
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="design-info">
          <div className="design-header">
            <span className="badge">{CATEGORY_LABELS[design.category as Category]}</span>
            <h1 className="design-title font-display">{design.title}</h1>
          </div>

          {/* Creator */}
          <Link href={`/user/${design.creatorId}`} className="design-creator">
            <div className="design-creator-avatar">
              <User size={20} />
            </div>
            <span>by {design.creatorName}</span>
          </Link>

          {/* Stats & Actions */}
          <div className="design-stats">
            <span className="design-stat">
              <Eye size={16} />
              {design.viewCount} views
            </span>
          </div>

          {/* Action buttons */}
          <div className="design-actions" style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
            <button
              className={`btn ${hasLiked ? "btn-primary" : "btn-secondary"}`}
              onClick={handleToggleLike}
              disabled={!isAuthenticated || isLiking}
              style={{ flex: 1 }}
            >
              <Heart size={18} fill={hasLiked ? "currentColor" : "none"} />
              {design.likeCount} {design.likeCount === 1 ? "Like" : "Likes"}
            </button>
            <button
              className={`btn ${hasSaved ? "btn-primary" : "btn-secondary"}`}
              onClick={handleToggleSave}
              disabled={!isAuthenticated || isSaving}
              style={{ flex: 1 }}
            >
              <Bookmark size={18} fill={hasSaved ? "currentColor" : "none"} />
              {hasSaved ? "Saved" : "Save"}
            </button>
          </div>
          {!isAuthenticated && (
            <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: "var(--space-xs)" }}>
              Log in to like and save designs
            </p>
          )}

          {/* Description */}
          {design.description && (
            <div className="design-description">
              <p>{design.description}</p>
            </div>
          )}

          {/* Tags */}
          {design.tags && design.tags.length > 0 && (
            <div className="design-tags">
              {design.tags.map((tag) => (
                <span key={tag} className="badge badge-outline">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Import String */}
          {design.importString && (
            <div className="design-import">
              <h3>Import String</h3>
              <div className="design-import-box">
                <code className="design-import-preview">
                  {design.importString.slice(0, 100)}...
                </code>
                <button
                  className={`btn ${copied ? "btn-primary" : "btn-secondary"}`}
                  onClick={handleCopyImportString}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? "Copied!" : "Copy String"}
                </button>
              </div>
            </div>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <div style={{ marginTop: "var(--space-lg)", paddingTop: "var(--space-lg)", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <Link
                  href={`/design/${id}/edit`}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  <Edit size={16} />
                  Edit Design
                </Link>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowDeleteModal(true)}
                  style={{ color: "#ef4444" }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Report Button */}
          {isAuthenticated && user?.id !== design.creatorId && (
            <div style={{ marginTop: "var(--space-lg)", paddingTop: "var(--space-lg)", borderTop: "1px solid var(--border)" }}>
              <button
                className="btn btn-ghost"
                onClick={() => setShowReportModal(true)}
                disabled={hasReported === true}
                style={{ color: hasReported ? "var(--text-muted)" : "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                <Flag size={16} />
                {hasReported ? "Reported" : "Report Design"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-lg)",
          }}
          onClick={() => !isReporting && setShowReportModal(false)}
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
            {reportSuccess ? (
              <div style={{ textAlign: "center", padding: "var(--space-lg)" }}>
                <Check size={48} style={{ color: "#22c55e", marginBottom: "var(--space-md)" }} />
                <h3 style={{ marginBottom: "var(--space-sm)" }}>Report Submitted</h3>
                <p className="text-secondary">Thank you for helping keep GearForge safe.</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
                  <h2 style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <Flag size={20} />
                    Report Design
                  </h2>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowReportModal(false)}
                    disabled={isReporting}
                    style={{ padding: "var(--space-xs)" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {reportError && (
                  <div
                    style={{
                      padding: "var(--space-sm)",
                      marginBottom: "var(--space-md)",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "var(--radius)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                      color: "#ef4444",
                      fontSize: "0.875rem",
                    }}
                  >
                    <AlertCircle size={16} />
                    {reportError}
                  </div>
                )}

                <div style={{ marginBottom: "var(--space-lg)" }}>
                  <label style={{ display: "block", marginBottom: "var(--space-sm)", fontWeight: 500 }}>
                    Reason for report
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                    {[
                      { value: "inappropriate", label: "Inappropriate content" },
                      { value: "spam", label: "Spam or misleading" },
                      { value: "stolen", label: "Stolen design" },
                      { value: "broken", label: "Broken / doesn't work" },
                      { value: "other", label: "Other" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-sm)",
                          padding: "var(--space-sm)",
                          background: reportReason === option.value ? "var(--surface-elevated)" : "transparent",
                          borderRadius: "var(--radius)",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={option.value}
                          checked={reportReason === option.value}
                          onChange={(e) => setReportReason(e.target.value as typeof reportReason)}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "var(--space-lg)" }}>
                  <label
                    htmlFor="reportDetails"
                    style={{ display: "block", marginBottom: "var(--space-xs)", fontWeight: 500 }}
                  >
                    Additional details (optional)
                  </label>
                  <textarea
                    id="reportDetails"
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide any additional context..."
                    className="input"
                    rows={3}
                    maxLength={500}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "var(--space-sm)", justifyContent: "flex-end" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowReportModal(false)}
                    disabled={isReporting}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitReport}
                    disabled={isReporting}
                  >
                    {isReporting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
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
              maxWidth: 400,
              width: "100%",
              padding: "var(--space-xl)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center" }}>
              <Trash2 size={48} style={{ color: "#ef4444", marginBottom: "var(--space-md)" }} />
              <h2 style={{ marginBottom: "var(--space-sm)" }}>Delete Design?</h2>
              <p className="text-secondary" style={{ marginBottom: "var(--space-lg)" }}>
                This action cannot be undone. Your design will be permanently removed.
              </p>
              <div style={{ display: "flex", gap: "var(--space-sm)", justifyContent: "center" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleDeleteDesign}
                  disabled={isDeleting}
                  style={{ background: "#ef4444", color: "white" }}
                >
                  {isDeleting ? "Deleting..." : "Delete Design"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
