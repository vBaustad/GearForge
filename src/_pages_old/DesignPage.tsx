import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  ArrowLeft,
  Heart,
  Eye,
  Copy,
  Check,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Flag,
  Bookmark,
  Share2,
  X,
  ZoomIn,
  FolderPlus,
  Plus,
  Package,
} from "lucide-react";
import { CATEGORY_LABELS, type Category } from "@/types/creation";
import { useAuth } from "@/lib/auth";
import { DesignCard } from "@/components/DesignCard";
import { SEO, createDesignSchema } from "@/components/SEO";

type ReportReason = "inappropriate" | "spam" | "stolen" | "broken" | "other";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam or misleading" },
  { value: "stolen", label: "Stolen design (not original)" },
  { value: "broken", label: "Broken or doesn't work" },
  { value: "other", label: "Other" },
];

export function DesignPage() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("inappropriate");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const creation = useQuery(
    api.creations.getById,
    id ? { id: id as Id<"creations"> } : "skip"
  );

  // Check if user has liked this design
  const hasLiked = useQuery(
    api.likes.hasLiked,
    user && id ? { userId: user.id, creationId: id as Id<"creations"> } : "skip"
  );

  // Check if user has already reported this design
  const hasReported = useQuery(
    api.reports.hasReported,
    user && id ? { userId: user.id, creationId: id as Id<"creations"> } : "skip"
  );

  // Check if user has saved this design
  const hasSaved = useQuery(
    api.saves.hasSaved,
    user && id ? { userId: user.id, creationId: id as Id<"creations"> } : "skip"
  );

  // Get related designs
  const relatedDesigns = useQuery(
    api.creations.getRelated,
    id ? { creationId: id as Id<"creations">, limit: 4 } : "skip"
  );

  // Fetch decor item details for items used in this design
  const itemDecorIds = creation?.items?.map((i) => i.decorId) ?? [];
  const decorItems = useQuery(
    api.gameData.getDecorByIds,
    itemDecorIds.length > 0 ? { blizzardIds: itemDecorIds } : "skip"
  );

  const incrementViews = useMutation(api.creations.incrementViews);
  const toggleLike = useMutation(api.likes.toggle);
  const toggleSave = useMutation(api.saves.toggle);
  const submitReport = useMutation(api.reports.submit);
  const addToCollection = useMutation(api.collections.addItem);
  const removeFromCollection = useMutation(api.collections.removeItem);
  const createCollection = useMutation(api.collections.create);

  // Get user's collections for this design
  const userCollections = useQuery(
    api.collections.getContainingCollections,
    user && id ? { userId: user.id, creationId: id as Id<"creations"> } : "skip"
  );

  // New collection form state
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  // Sync like state from query
  useEffect(() => {
    if (hasLiked !== undefined) {
      setIsLiked(hasLiked);
    }
  }, [hasLiked]);

  // Sync save state from query
  useEffect(() => {
    if (hasSaved !== undefined) {
      setIsSaved(hasSaved);
    }
  }, [hasSaved]);

  // Sync like count from creation
  useEffect(() => {
    if (creation) {
      setLikeCount(creation.likeCount);
    }
  }, [creation]);

  // Increment view count on mount
  useEffect(() => {
    if (id) {
      incrementViews({ id: id as Id<"creations"> });
    }
  }, [id, incrementViews]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen || !creation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setCurrentImageIndex((i) =>
          i === 0 ? creation.imageUrls.length - 1 : i - 1
        );
      } else if (e.key === "ArrowRight") {
        setCurrentImageIndex((i) =>
          i === creation.imageUrls.length - 1 ? 0 : i + 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, creation]);

  const handleCopyImportString = async () => {
    if (!creation) return;

    try {
      await navigator.clipboard.writeText(creation.importString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleToggleLike = async () => {
    if (!user || !id || isLiking) return;

    setIsLiking(true);
    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((prev) => (prev ?? 0) + (wasLiked ? -1 : 1));

    try {
      await toggleLike({
        userId: user.id,
        creationId: id as Id<"creations">,
      });
    } catch (err) {
      // Revert on error
      setIsLiked(wasLiked);
      setLikeCount((prev) => (prev ?? 0) + (wasLiked ? 1 : -1));
      console.error("Failed to toggle like:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user || !id || isSaving) return;

    setIsSaving(true);
    // Optimistic update
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    try {
      await toggleSave({
        userId: user.id,
        creationId: id as Id<"creations">,
      });
    } catch (err) {
      // Revert on error
      setIsSaved(wasSaved);
      console.error("Failed to toggle save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!user || !id || isReporting) return;

    setIsReporting(true);
    try {
      await submitReport({
        creationId: id as Id<"creations">,
        reporterId: user.id,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSubmitted(false);
        setReportReason("inappropriate");
        setReportDetails("");
      }, 2000);
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Failed to submit report. You may have already reported this design.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleToggleCollection = async (collectionId: Id<"collections">, isInCollection: boolean) => {
    if (!id) return;
    try {
      if (isInCollection) {
        await removeFromCollection({
          collectionId,
          creationId: id as Id<"creations">,
        });
      } else {
        await addToCollection({
          collectionId,
          creationId: id as Id<"creations">,
        });
      }
    } catch (err) {
      console.error("Failed to toggle collection:", err);
    }
  };

  const handleCreateAndAddToCollection = async () => {
    if (!user || !id || !newCollectionName.trim() || isCreatingCollection) return;
    setIsCreatingCollection(true);
    try {
      const collectionId = await createCollection({
        name: newCollectionName.trim(),
        ownerId: user.id,
        isPublic: false,
      });
      await addToCollection({
        collectionId,
        creationId: id as Id<"creations">,
      });
      setNewCollectionName("");
    } catch (err) {
      console.error("Failed to create collection:", err);
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  // Loading state
  if (creation === undefined) {
    return (
      <div className="container page-section">
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="skeleton" style={{ height: '1.5rem', width: '6rem' }} />
        </div>
        <div className="skeleton" style={{ aspectRatio: '16/9', width: '100%', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)' }} />
        <div className="skeleton" style={{ height: '2rem', width: '66%', marginBottom: 'var(--space-md)' }} />
        <div className="skeleton" style={{ height: '1rem', width: '33%' }} />
      </div>
    );
  }

  // Not found state
  if (creation === null) {
    return (
      <div className="container page-section">
        <div className="card empty-state">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Design Not Found
          </h2>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
            This design may have been removed or doesn't exist.
          </p>
          <Link to="/browse" className="btn btn-primary">
            Browse Designs
          </Link>
        </div>
      </div>
    );
  }

  const hasMultipleImages = creation.imageUrls.length > 1;

  // SEO description - truncate if too long
  const seoDescription = creation.description
    ? creation.description.slice(0, 155) + (creation.description.length > 155 ? "..." : "")
    : `${creation.title} - A WoW housing design by ${creation.creatorName}. Browse this ${CATEGORY_LABELS[creation.category as Category]} design and copy the import string.`;

  // JSON-LD for design
  const designSchema = createDesignSchema({
    title: creation.title,
    description: creation.description,
    image: creation.imageUrls[0],
    creator: creation.creatorName,
    createdAt: creation.createdAt,
    url: `/design/${id}`,
  });

  // Breadcrumbs for navigation
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Browse", url: "/browse" },
    { name: creation.title, url: `/design/${id}` },
  ];

  return (
    <>
      <SEO
        title={`${creation.title} by ${creation.creatorName}`}
        description={seoDescription}
        image={creation.imageUrls[0]}
        url={`/design/${id}`}
        type="article"
        keywords={`WoW housing design, WoW ${CATEGORY_LABELS[creation.category as Category].toLowerCase()}, ${creation.title}, World of Warcraft ${CATEGORY_LABELS[creation.category as Category].toLowerCase()} build, WoW housing import string, TWW housing, WoW home layout`}
        breadcrumbs={breadcrumbs}
        jsonLd={designSchema}
      />
      <div className="container page-section design-page">
        {/* Back link */}
        <Link to="/browse" className="back-link">
        <ArrowLeft size={16} />
        Back to Browse
      </Link>

      {/* Header: Title, creator, stats */}
      <div className="design-header">
        <div className="design-header-top">
          <span className="badge badge-gold">{CATEGORY_LABELS[creation.category as Category]}</span>
          <div className="design-stats-inline">
            <span><Heart size={14} className={isLiked ? "text-accent" : ""} /> {formatNumber(likeCount ?? creation.likeCount)}</span>
            <span><Eye size={14} /> {formatNumber(creation.viewCount)}</span>
          </div>
        </div>
        <h1 className="font-display">{creation.title}</h1>
        <div className="design-meta">
          <Link to={`/user/${creation.creatorId}`} className="design-creator-link">
            <User size={14} />
            {creation.creatorName}
          </Link>
          <span className="design-date">
            <Calendar size={14} />
            {formatDate(creation.createdAt)}
          </span>
        </div>
      </div>

      {/* Image */}
      {creation.imageUrls.length > 0 && (
      <div className="design-image-container">
        <div className="image-gallery">
          <img
            src={creation.imageUrls[currentImageIndex]}
            alt={`${creation.title} - Image ${currentImageIndex + 1}`}
            className="gallery-image gallery-image-clickable"
            onClick={() => setLightboxOpen(true)}
          />
          <button
            className="gallery-zoom-btn"
            onClick={() => setLightboxOpen(true)}
            aria-label="View full size"
          >
            <ZoomIn size={18} />
          </button>

          {hasMultipleImages && (
            <>
              <button
                onClick={() =>
                  setCurrentImageIndex((i) =>
                    i === 0 ? creation.imageUrls.length - 1 : i - 1
                  )
                }
                className="gallery-nav gallery-nav-prev"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() =>
                  setCurrentImageIndex((i) =>
                    i === creation.imageUrls.length - 1 ? 0 : i + 1
                  )
                }
                className="gallery-nav gallery-nav-next"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>

              <div className="gallery-dots">
                {creation.imageUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`gallery-dot ${i === currentImageIndex ? "active" : ""}`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Actions bar */}
      <div className="design-actions">
        <button
          onClick={handleCopyImportString}
          className={`btn ${copied ? "btn-primary" : "btn-secondary"}`}
        >
          {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Import String</>}
        </button>

        {user && creation.creatorId === user.id && (
          <Link to={`/design/${id}/edit`} className="btn btn-secondary">
            <Edit2 size={16} /> Edit
          </Link>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Icon buttons on the right */}
        <div className="design-icon-actions">
          <button
            onClick={handleToggleLike}
            disabled={!isAuthenticated || isLiking}
            className={`icon-btn ${isLiked ? "active" : ""}`}
            title={isLiked ? "Unlike" : "Like"}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button
            onClick={handleToggleSave}
            disabled={!isAuthenticated || isSaving}
            className={`icon-btn ${isSaved ? "active" : ""}`}
            title={isSaved ? "Unsave" : "Save"}
          >
            <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => setShowCollectionModal(true)}
            disabled={!isAuthenticated}
            className="icon-btn"
            title="Add to collection"
          >
            <FolderPlus size={20} />
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: creation.title,
                  text: `Check out this WoW housing design: ${creation.title}`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
              }
            }}
            className="icon-btn"
            title="Share"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Tags */}
      {creation.tags.length > 0 && (
        <div className="design-tags">
          {creation.tags.map((tag) => (
            <span key={tag} className="badge badge-outline">{tag}</span>
          ))}
        </div>
      )}

      {/* Description */}
      {creation.description && (
        <div className="design-description-block">
          <h2>About this design</h2>
          <p>{creation.description}</p>
        </div>
      )}

      {/* Items Used */}
      {creation.items && creation.items.length > 0 && (
        <div className="design-items-block">
          <h2>Items Used ({creation.items.length})</h2>
          <div className="design-items-list">
            {creation.items.map((item) => {
              const decorItem = decorItems?.find((d) => d?.blizzardId === item.decorId);
              const wowheadUrl = decorItem?.wowItemId
                ? `https://www.wowhead.com/item=${decorItem.wowItemId}`
                : null;

              const content = (
                <>
                  <div className="design-item-icon">
                    {decorItem?.iconUrl ? (
                      <img src={decorItem.iconUrl} alt="" loading="lazy" />
                    ) : (
                      <Package size={20} />
                    )}
                  </div>
                  <div className="design-item-info">
                    <span className="design-item-name">
                      {decorItem?.name ?? `Decor #${item.decorId}`}
                    </span>
                    {decorItem?.category && (
                      <span className="design-item-category">{decorItem.category}</span>
                    )}
                  </div>
                  <span className="design-item-quantity">×{item.quantity}</span>
                </>
              );

              if (wowheadUrl) {
                return (
                  <a
                    key={item.decorId}
                    href={wowheadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="design-item design-item-link"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div key={item.decorId} className="design-item">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import string preview */}
      <div className="design-import-block">
        <h2>Import String</h2>
        <pre className="import-string-box">
          {creation.importString.slice(0, 200)}
          {creation.importString.length > 200 && "..."}
        </pre>
      </div>

      {/* Report */}
      {isAuthenticated && user && creation.creatorId !== user.id && (
        <button
          className="btn btn-ghost design-report-btn"
          onClick={() => setShowReportModal(true)}
          disabled={hasReported === true}
        >
          <Flag size={14} />
          {hasReported ? "Reported" : "Report this design"}
        </button>
      )}

      {/* Related Designs */}
      {relatedDesigns && relatedDesigns.length > 0 && (
        <div className="related-designs">
          <h2>More Like This</h2>
          <div className="related-designs-grid">
            {relatedDesigns.map((design) => (
              <DesignCard
                key={design._id}
                id={design._id}
                title={design.title}
                thumbnailUrl={design.thumbnailUrl}
                category={design.category}
                creatorName={design.creatorName}
                likeCount={design.likeCount}
              />
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-backdrop" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {reportSubmitted ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                <Check size={48} style={{ color: '#22c55e', marginBottom: 'var(--space-md)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                  Report Submitted
                </h3>
                <p className="text-secondary">
                  Thank you for helping keep our community safe.
                </p>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                  Report Design
                </h3>
                <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
                  Let us know why this design should be reviewed.
                </p>

                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as ReportReason)}
                    className="input"
                  >
                    {REPORT_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional details (optional)</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="input textarea"
                    rows={3}
                    placeholder="Provide any additional context..."
                    maxLength={500}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="btn btn-secondary"
                    disabled={isReporting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    className="btn btn-primary"
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

      {/* Lightbox Modal */}
      {lightboxOpen && creation.imageUrls.length > 0 && (
        <div className="lightbox-backdrop" onClick={() => setLightboxOpen(false)}>
          <button
            className="lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <X size={24} />
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={creation.imageUrls[currentImageIndex]}
              alt={`${creation.title} - Image ${currentImageIndex + 1}`}
              className="lightbox-image"
            />
          </div>

          {creation.imageUrls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((i) =>
                    i === 0 ? creation.imageUrls.length - 1 : i - 1
                  );
                }}
                className="lightbox-nav lightbox-nav-prev"
                aria-label="Previous image"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((i) =>
                    i === creation.imageUrls.length - 1 ? 0 : i + 1
                  );
                }}
                className="lightbox-nav lightbox-nav-next"
                aria-label="Next image"
              >
                <ChevronRight size={32} />
              </button>

              <div className="lightbox-counter">
                {currentImageIndex + 1} / {creation.imageUrls.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add to Collection Modal */}
      {showCollectionModal && (
        <div className="modal-backdrop" onClick={() => setShowCollectionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
              Add to Collection
            </h3>

            {/* Existing collections */}
            {userCollections && userCollections.length > 0 && (
              <div className="collection-list">
                {userCollections.map((collection) => (
                  <button
                    key={collection._id}
                    onClick={() => handleToggleCollection(collection._id as Id<"collections">, collection.contains)}
                    className={`collection-list-item ${collection.contains ? "active" : ""}`}
                  >
                    <span>{collection.name}</span>
                    {collection.contains && <Check size={16} />}
                  </button>
                ))}
              </div>
            )}

            {/* Create new collection */}
            <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)' }}>
              <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: 'var(--space-sm)' }}>
                Or create a new collection:
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name..."
                  className="input"
                  style={{ flex: 1 }}
                  maxLength={50}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateAndAddToCollection();
                    }
                  }}
                />
                <button
                  onClick={handleCreateAndAddToCollection}
                  className="btn btn-primary"
                  disabled={!newCollectionName.trim() || isCreatingCollection}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-lg)', textAlign: 'right' }}>
              <button
                onClick={() => setShowCollectionModal(false)}
                className="btn btn-secondary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
