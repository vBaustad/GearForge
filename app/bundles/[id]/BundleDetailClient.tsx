"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import {
  Heart,
  Eye,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useAuth } from "@/lib/auth";

const CATEGORIES: Record<string, string> = {
  bedroom: "Bedroom",
  living_room: "Living Room",
  kitchen: "Kitchen",
  garden: "Garden",
  tavern: "Tavern",
  throne_room: "Throne Room",
  workshop: "Workshop",
  library: "Library",
  exterior: "Exterior",
  other: "Other",
};

interface BundleDetailClientProps {
  bundleId: string;
}

export function BundleDetailClient({ bundleId }: BundleDetailClientProps) {
  const { user, sessionToken } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const bundle = useQuery(api.roomBundles.getById, {
    id: bundleId as Id<"roomBundles">,
  });
  const incrementViews = useMutation(api.roomBundles.incrementViews);
  const toggleLike = useMutation(api.roomBundles.toggleLike);
  const hasLiked = useQuery(
    api.roomBundles.hasLiked,
    user && bundle
      ? { userId: user.id as Id<"users">, bundleId: bundleId as Id<"roomBundles"> }
      : "skip"
  );

  // Increment views on mount
  useEffect(() => {
    if (bundle) {
      incrementViews({ id: bundleId as Id<"roomBundles"> });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundleId]);

  const handleLike = async () => {
    if (!sessionToken) return;
    try {
      await toggleLike({
        sessionToken,
        bundleId: bundleId as Id<"roomBundles">,
      });
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const nextImage = () => {
    if (bundle?.allImages) {
      setCurrentImageIndex((i) => (i + 1) % bundle.allImages.length);
    }
  };

  const prevImage = () => {
    if (bundle?.allImages) {
      setCurrentImageIndex(
        (i) => (i - 1 + bundle.allImages.length) % bundle.allImages.length
      );
    }
  };

  if (bundle === undefined) {
    return (
      <div className="container page-section">
        <div style={{ minHeight: "50vh" }} />
      </div>
    );
  }

  if (bundle === null) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <h2 style={{ marginBottom: "var(--space-md)" }}>Bundle Not Found</h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            This room bundle doesn&apos;t exist or has been removed.
          </p>
          <Link href="/bundles" className="btn btn-primary">
            Browse Bundles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <Breadcrumbs
        items={[
          { label: "Room Bundles", href: "/bundles" },
          { label: bundle.title },
        ]}
      />

      <div className="bundle-layout">
        {/* Gallery */}
        <div className="bundle-gallery">
          {bundle.allImages && bundle.allImages.length > 0 ? (
            <>
              <div className="gallery-main">
                <img
                  src={bundle.allImages[currentImageIndex]}
                  alt={`${bundle.title} - Image ${currentImageIndex + 1}`}
                />
                {bundle.allImages.length > 1 && (
                  <>
                    <button className="gallery-nav prev" onClick={prevImage}>
                      <ChevronLeft size={24} />
                    </button>
                    <button className="gallery-nav next" onClick={nextImage}>
                      <ChevronRight size={24} />
                    </button>
                    <div className="gallery-counter">
                      {currentImageIndex + 1} / {bundle.allImages.length}
                    </div>
                  </>
                )}
              </div>
              {bundle.allImages.length > 1 && (
                <div className="gallery-thumbs">
                  {bundle.allImages.slice(0, 8).map((url: string, i: number) => (
                    <button
                      key={i}
                      className={`thumb ${i === currentImageIndex ? "active" : ""}`}
                      onClick={() => setCurrentImageIndex(i)}
                    >
                      <img src={url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="gallery-placeholder">No images available</div>
          )}
        </div>

        {/* Info */}
        <div className="bundle-info">
          <span className="bundle-category">
            {CATEGORIES[bundle.category] ?? bundle.category}
          </span>

          <h1>{bundle.title}</h1>

          {bundle.description && (
            <p className="bundle-description">{bundle.description}</p>
          )}

          {/* Creator */}
          <Link href={`/user/${bundle.creatorId}`} className="creator-card">
            {bundle.creatorAvatarUrl ? (
              <img
                src={bundle.creatorAvatarUrl}
                alt={bundle.creatorName}
                className="creator-avatar"
              />
            ) : (
              <div className="creator-avatar-placeholder">
                <User size={20} />
              </div>
            )}
            <div className="creator-info">
              <span className="creator-name">
                {bundle.creatorName}
                {bundle.creatorIsVerified && <VerifiedBadge />}
              </span>
              <span className="creator-label">Creator</span>
            </div>
          </Link>

          {/* Stats & Actions */}
          <div className="stats-row">
            <div className="stat">
              <Eye size={18} />
              <span>{bundle.viewCount} views</span>
            </div>
            <div className="stat">
              <Heart size={18} />
              <span>{bundle.likeCount} likes</span>
            </div>
          </div>

          <button
            className={`btn btn-lg ${hasLiked ? "btn-liked" : "btn-primary"}`}
            onClick={handleLike}
            disabled={!sessionToken}
          >
            <Heart size={20} fill={hasLiked ? "currentColor" : "none"} />
            {hasLiked ? "Liked" : "Like Bundle"}
          </button>

          {/* Tags */}
          {bundle.tags && bundle.tags.length > 0 && (
            <div className="tags">
              {bundle.tags.map((tag: string) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Included Designs */}
      <section className="included-designs">
        <h2>Included Designs ({bundle.designs?.length ?? 0})</h2>
        <div className="designs-grid">
          {bundle.designs?.map((design: any) => (
            <Link
              key={design._id}
              href={`/design/${design._id}`}
              className="design-card"
            >
              <div className="design-thumbnail">
                {design.thumbnailUrl ? (
                  <img src={design.thumbnailUrl} alt={design.title} />
                ) : (
                  <div className="thumbnail-placeholder" />
                )}
              </div>
              <div className="design-info">
                <h3>{design.title}</h3>
                <span className="design-category">
                  {CATEGORIES[design.category] ?? design.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Back Link */}
      <div style={{ marginTop: "var(--space-2xl)" }}>
        <Link href="/bundles" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Back to Bundles
        </Link>
      </div>

      <style jsx>{`
        .bundle-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: var(--space-2xl);
          margin-bottom: var(--space-2xl);
        }

        @media (max-width: 900px) {
          .bundle-layout {
            grid-template-columns: 1fr;
          }
        }

        .bundle-gallery {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .gallery-main {
          position: relative;
          aspect-ratio: 16 / 10;
          background: var(--bg-deep);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .gallery-main img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gallery-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.6);
          border: none;
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .gallery-nav:hover {
          background: rgba(0, 0, 0, 0.8);
        }

        .gallery-nav.prev {
          left: var(--space-md);
        }

        .gallery-nav.next {
          right: var(--space-md);
        }

        .gallery-counter {
          position: absolute;
          bottom: var(--space-md);
          right: var(--space-md);
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 12px;
          border-radius: var(--radius);
          font-size: 0.875rem;
        }

        .gallery-thumbs {
          display: flex;
          gap: var(--space-sm);
          overflow-x: auto;
        }

        .thumb {
          flex-shrink: 0;
          width: 80px;
          height: 60px;
          border: 2px solid transparent;
          border-radius: var(--radius);
          overflow: hidden;
          cursor: pointer;
          padding: 0;
          background: none;
        }

        .thumb.active {
          border-color: var(--accent);
        }

        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gallery-placeholder {
          aspect-ratio: 16 / 10;
          background: var(--bg-deep);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .bundle-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .bundle-category {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent);
        }

        .bundle-info h1 {
          margin: 0;
          font-size: 1.75rem;
          line-height: 1.2;
        }

        .bundle-description {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .creator-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          text-decoration: none;
          color: inherit;
          transition: background 0.15s ease;
        }

        .creator-card:hover {
          background: var(--surface-elevated);
        }

        .creator-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }

        .creator-avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--bg-deep);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .creator-info {
          display: flex;
          flex-direction: column;
        }

        .creator-name {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .creator-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .stats-row {
          display: flex;
          gap: var(--space-xl);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--text-muted);
        }

        .btn-lg {
          padding: var(--space-md) var(--space-xl);
          font-size: 1rem;
        }

        .btn-liked {
          background: var(--accent);
          color: white;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .tag {
          font-size: 0.75rem;
          padding: 4px 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text-secondary);
        }

        .included-designs {
          margin-top: var(--space-2xl);
        }

        .included-designs h2 {
          font-size: 1.25rem;
          margin-bottom: var(--space-lg);
        }

        .designs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-md);
        }

        .design-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .design-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .design-thumbnail {
          aspect-ratio: 16 / 9;
          background: var(--bg-deep);
        }

        .design-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          width: 100%;
          height: 100%;
        }

        .design-info {
          padding: var(--space-sm) var(--space-md);
        }

        .design-info h3 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .design-category {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
