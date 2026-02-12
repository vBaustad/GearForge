"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Heart, Eye, Copy, Check, ArrowLeft, Bookmark, Flag, X, AlertCircle, Trash2, Edit, Youtube, ExternalLink, Package, User } from "lucide-react";
import { CommentSection } from "@/components/comments/CommentSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ItemsList } from "@/components/design/ItemsList";
import { BuildCosts } from "@/components/design/BuildCosts";
import { RelatedBuilds } from "@/components/design/RelatedBuilds";
import { ShareButtons } from "@/components/design/ShareButtons";
import { ImageGallery } from "@/components/design/ImageGallery";
import { InspiredBy } from "@/components/design/InspiredBy";
import { RemixesSection } from "@/components/design/RemixesSection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { CATEGORY_LABELS, type Category } from "@/types/creation";
import Script from "next/script";
import { reportSchema, validateInput } from "@/lib/validation";
import { getErrorMessage } from "@/lib/errorMessages";
import { trackDesignView, trackDesignLike, trackDesignSave, trackImportStringCopy } from "@/lib/analytics";

interface DesignPageClientProps {
  id: string;
}

export function DesignPageClient({ id }: DesignPageClientProps) {
  const [copied, setCopied] = useState(false);
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

  // Track gallery height to sync items list
  const galleryRef = useRef<HTMLDivElement>(null);
  const [galleryHeight, setGalleryHeight] = useState<number | null>(null);

  const updateGalleryHeight = useCallback(() => {
    if (galleryRef.current) {
      setGalleryHeight(galleryRef.current.offsetHeight);
    }
  }, []);

  // Update height on mount, resize, and when images load
  useEffect(() => {
    updateGalleryHeight();
    window.addEventListener("resize", updateGalleryHeight);

    // Listen for image loads within the gallery
    const gallery = galleryRef.current;
    if (gallery) {
      const images = gallery.querySelectorAll("img");
      images.forEach((img) => {
        if (img.complete) {
          updateGalleryHeight();
        } else {
          img.addEventListener("load", updateGalleryHeight);
        }
      });
    }

    // Also update after a delay as fallback
    const timer = setTimeout(updateGalleryHeight, 300);
    const timer2 = setTimeout(updateGalleryHeight, 1000);

    return () => {
      window.removeEventListener("resize", updateGalleryHeight);
      clearTimeout(timer);
      clearTimeout(timer2);
      if (gallery) {
        const images = gallery.querySelectorAll("img");
        images.forEach((img) => {
          img.removeEventListener("load", updateGalleryHeight);
        });
      }
    };
  }, [updateGalleryHeight]);

  const router = useRouter();
  const { user, isAuthenticated, sessionToken } = useAuth();

  // Validate ID before making queries
  const isValidId = id && id !== "undefined" && id !== "null" && id.length > 0;

  const design = useQuery(
    api.creations.getById,
    isValidId ? { id: id as Id<"creations"> } : "skip"
  );
  const incrementViews = useMutation(api.creations.incrementViews);
  const toggleLike = useMutation(api.likes.toggle);
  const toggleSave = useMutation(api.saves.toggle);
  const submitReport = useMutation(api.reports.submit);
  const deleteDesign = useMutation(api.creations.remove);

  // Check if user has liked/saved/reported this design
  const hasLiked = useQuery(
    api.likes.hasLiked,
    user && isValidId ? { userId: user.id, creationId: id as Id<"creations"> } : "skip"
  );
  const hasSaved = useQuery(
    api.saves.hasSaved,
    user && isValidId ? { userId: user.id, creationId: id as Id<"creations"> } : "skip"
  );
  const hasReported = useQuery(
    api.reports.hasReported,
    user && isValidId ? { userId: user.id, creationId: id as Id<"creations"> } : "skip"
  );

  // Get user's linked character data for achievement/quest completion tracking
  const linkedCharacterData = useQuery(
    api.users.getLinkedCharacter,
    sessionToken ? { sessionToken } : "skip"
  );

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Increment views on mount and track analytics
  useEffect(() => {
    if (design && isValidId) {
      incrementViews({ id: id as Id<"creations"> });
      trackDesignView(id, design.category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isValidId]);

  const handleCopyImportString = async () => {
    if (!design?.importString) return;

    try {
      await navigator.clipboard.writeText(design.importString);
      setCopied(true);
      trackImportStringCopy(id);
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
      // Only track if user is liking (not unliking)
      if (!hasLiked) {
        trackDesignLike(id);
      }
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
      // Only track if user is saving (not unsaving)
      if (!hasSaved) {
        trackDesignSave(id);
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!sessionToken || isReporting) return;
    setReportError(null);

    // Validate report data
    const validation = validateInput(reportSchema, {
      reason: reportReason,
      details: reportDetails.trim() || undefined,
    });

    if (!validation.success) {
      setReportError(validation.error);
      return;
    }

    setIsReporting(true);

    try {
      await submitReport({
        sessionToken,
        creationId: id as Id<"creations">,
        reason: validation.data.reason,
        details: validation.data.details,
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
      setReportError(getErrorMessage(err));
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
      alert(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Check if current user is the owner
  const isOwner = user && design?.creatorId === user.id;

  // Invalid ID - show not found immediately
  if (!isValidId) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
            Design Not Found
          </h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            This design doesn&apos;t exist.
          </p>
          <Link href="/browse" className="btn btn-primary">
            Browse Designs
          </Link>
        </div>
      </div>
    );
  }

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
      {/* Breadcrumbs for SEO and navigation */}
      <Breadcrumbs
        items={[
          { label: "Browse", href: "/browse" },
          { label: CATEGORY_LABELS[design.category as Category], href: `/browse?category=${design.category}` },
          { label: design.title },
        ]}
      />

      {/* Main content area: Image + Items side by side */}
      <div className="design-main-grid">
        {/* Left: Image gallery with title overlay */}
        <div className="design-gallery-column" ref={galleryRef}>
          <ImageGallery
            images={images}
            title={design.title}
            overlayContent={
              <div>
                <span className="badge" style={{ marginBottom: "var(--space-sm)", display: "inline-block" }}>
                  {CATEGORY_LABELS[design.category as Category]}
                </span>
                <h1
                  className="font-display"
                  style={{
                    fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                    fontWeight: 600,
                    color: "white",
                    margin: 0,
                    marginBottom: "var(--space-sm)",
                    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {design.title}
                </h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-md)", fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Eye size={14} />
                    {design.viewCount.toLocaleString()}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Heart size={14} />
                    {design.likeCount.toLocaleString()}
                  </span>
                  {design.totalItems > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Package size={14} />
                      {design.totalItems} items
                    </span>
                  )}
                  <span>
                    {new Date(design._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            }
          />
        </div>

        {/* Right: Items List - height synced to gallery */}
        {design.enrichedItems && design.enrichedItems.length > 0 && (
          <div
            className="design-items-sidebar"
            style={galleryHeight ? { maxHeight: galleryHeight, height: galleryHeight } : undefined}
          >
            <ItemsList
              items={design.enrichedItems}
              itemsByCategory={design.itemsByCategory || {}}
              totalItems={design.totalItems || 0}
              uniqueItems={design.uniqueItems || 0}
              creationId={id as Id<"creations">}
              sessionToken={sessionToken ?? undefined}
            />
          </div>
        )}
      </div>

      {/* Inspired By Section (if this is a remix) */}
      {design.inspiredByInfo && (
        <InspiredBy original={design.inspiredByInfo} />
      )}

      {/* Unified Details Section: Creator + Actions + Description + Tags */}
      <div className="design-details-section">
        {/* Header: Creator info + Action buttons */}
        <div className="design-details-header">
          {/* Creator */}
          <div className="design-details-creator">
            <Link href={`/user/${design.creatorId}`} className="design-details-creator-avatar">
              {design.creatorAvatarUrl ? (
                <img src={design.creatorAvatarUrl} alt={design.creatorName} />
              ) : (
                <User size={20} style={{ color: "var(--text-muted)" }} />
              )}
            </Link>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                <Link
                  href={`/user/${design.creatorId}`}
                  style={{ color: "var(--text-primary)", textDecoration: "none", fontWeight: 600, fontSize: "1rem" }}
                >
                  {design.creatorName.split("#")[0]}
                </Link>
                {design.creatorIsVerified && <VerifiedBadge size={16} />}
              </div>
              <p className="text-muted" style={{ fontSize: "0.8125rem", margin: 0 }}>Creator</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="design-details-actions">
            <button
              className={`btn btn-sm ${hasLiked ? "btn-primary" : "btn-secondary"}`}
              onClick={handleToggleLike}
              disabled={!isAuthenticated || isLiking}
            >
              <Heart size={16} fill={hasLiked ? "currentColor" : "none"} />
              {hasLiked ? "Liked" : "Like"}
            </button>
            <button
              className={`btn btn-sm ${hasSaved ? "btn-primary" : "btn-secondary"}`}
              onClick={handleToggleSave}
              disabled={!isAuthenticated || isSaving}
            >
              <Bookmark size={16} fill={hasSaved ? "currentColor" : "none"} />
              {hasSaved ? "Saved" : "Save"}
            </button>
            <ShareButtons designId={id} title={design.title} creatorName={design.creatorName} />
          </div>
        </div>

        {/* Body: Description, Tags, Import, etc. */}
        {(design.description || (design.tags && design.tags.length > 0) || design.importString) && (
          <div className="design-details-body">
            {design.description && (
              <div className="design-description">
                <p style={{ margin: 0 }}>{design.description}</p>
              </div>
            )}

            {design.tags && design.tags.length > 0 && (
              <div className="design-tags">
                {design.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      borderRadius: "var(--radius)",
                      background: "rgba(96, 165, 250, 0.15)",
                      color: "rgb(147, 197, 253)",
                      border: "1px solid rgba(96, 165, 250, 0.3)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {design.importString && design.importString.trim().length > 0 && (
              <div className="design-import">
                <h3 style={{ fontSize: "0.875rem", marginBottom: "var(--space-sm)" }}>Import String</h3>
                <div className="design-import-box">
                  <code className="design-import-preview">{design.importString.slice(0, 100)}...</code>
                  <button className={`btn btn-sm ${copied ? "btn-primary" : "btn-secondary"}`} onClick={handleCopyImportString}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* YouTube Video */}
        {design.youtubeVideoId && (
          <div style={{ marginTop: "var(--space-lg)", paddingTop: "var(--space-lg)", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-md)", fontSize: "0.875rem" }}>
              <Youtube size={18} style={{ color: "#FF0000" }} />
              Video Showcase
            </h3>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "var(--radius-md)", background: "var(--bg-deep)" }}>
              <iframe
                src={`https://www.youtube.com/embed/${design.youtubeVideoId}`}
                title="Design showcase video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <div style={{ marginTop: "var(--space-lg)", paddingTop: "var(--space-lg)", borderTop: "1px solid var(--border)", display: "flex", gap: "var(--space-sm)" }}>
            <Link href={`/design/${id}/edit`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Edit size={16} />
              Edit Design
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteModal(true)} style={{ color: "#ef4444" }}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}

        {/* Report Button - subtle, bottom right */}
        {isAuthenticated && user?.id !== design.creatorId && (
          <div style={{ marginTop: "var(--space-md)", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowReportModal(true)}
              disabled={hasReported === true}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                fontSize: "0.75rem",
                color: hasReported ? "var(--text-muted)" : "rgba(239, 68, 68, 0.7)",
                background: "transparent",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: hasReported ? "default" : "pointer",
                opacity: hasReported ? 0.5 : 0.6,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => !hasReported && (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => !hasReported && (e.currentTarget.style.opacity = "0.6")}
            >
              <Flag size={12} />
              {hasReported ? "Reported" : "Report"}
            </button>
          </div>
        )}
      </div>

      {/* Build Costs & Requirements */}
      {design.buildCosts && (
        <BuildCosts
          buildCosts={design.buildCosts}
          completedAchievements={linkedCharacterData?.completedAchievements}
          completedQuests={linkedCharacterData?.completedQuests}
        />
      )}

      {/* Comments Section */}
      <ErrorBoundary
        compact
        title="Unable to load comments"
        description="Something went wrong while loading comments. Please try again."
      >
        <CommentSection
          creationId={id as Id<"creations">}
          sessionToken={sessionToken ?? undefined}
          currentUserId={user?.id}
        />
      </ErrorBoundary>

      {/* Related Builds */}
      {design.creatorId && (
        <RelatedBuilds
          currentDesignId={id as Id<"creations">}
          creatorId={design.creatorId}
          category={design.category}
          creatorName={design.creatorName}
        />
      )}

      {/* Remixes Section (designs inspired by this one) */}
      {design.remixCount > 0 && (
        <RemixesSection
          creationId={id as Id<"creations">}
          remixCount={design.remixCount}
        />
      )}

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
