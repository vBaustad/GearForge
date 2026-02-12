"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { Lock, Globe, ArrowLeft, Trash2, Eye, Heart, Plus } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/lib/auth";

interface CollectionDetailClientProps {
  collectionId: string;
}

export function CollectionDetailClient({ collectionId }: CollectionDetailClientProps) {
  const { user, sessionToken } = useAuth();
  const collection = useQuery(api.collections.getById, {
    id: collectionId as Id<"collections">,
  });
  const removeItem = useMutation(api.collections.removeItem);

  const isOwner = user && collection && user.id === collection.ownerId;

  const handleRemoveItem = async (creationId: string) => {
    if (!sessionToken || !confirm("Remove this design from the collection?")) return;
    try {
      await removeItem({
        sessionToken,
        collectionId: collectionId as Id<"collections">,
        creationId: creationId as Id<"creations">,
      });
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  if (collection === undefined) {
    return (
      <div className="container page-section">
        <div style={{ minHeight: "50vh" }} />
      </div>
    );
  }

  if (collection === null) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <h2 style={{ marginBottom: "var(--space-md)" }}>Collection Not Found</h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            This collection doesn&apos;t exist or is private.
          </p>
          <Link href="/collections" className="btn btn-primary">
            Browse Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <Breadcrumbs
        items={[{ label: "Collections", href: "/collections" }, { label: collection.name }]}
      />

      {/* Header */}
      <div className="collection-header">
        <div className="collection-info">
          <div className="collection-title-row">
            <h1>{collection.name}</h1>
            {collection.isPublic ? (
              <span className="visibility-badge public">
                <Globe size={14} />
                Public
              </span>
            ) : (
              <span className="visibility-badge private">
                <Lock size={14} />
                Private
              </span>
            )}
          </div>
          {collection.description && (
            <p className="collection-description">{collection.description}</p>
          )}
          <div className="collection-meta">
            <Link href={`/user/${collection.ownerId}`} className="creator-link">
              by {collection.ownerName}
            </Link>
            <span className="meta-divider">·</span>
            <span>{collection.items?.length ?? 0} designs</span>
          </div>
        </div>
      </div>

      {/* Designs Grid */}
      {!collection.items || collection.items.length === 0 ? (
        <div className="card" style={{ padding: "var(--space-2xl)", textAlign: "center" }}>
          <p className="text-muted" style={{ marginBottom: "var(--space-md)" }}>
            This collection is empty.
          </p>
          {isOwner && (
            <Link href="/browse" className="btn btn-primary">
              <Plus size={18} />
              Add Designs
            </Link>
          )}
        </div>
      ) : (
        <div className="designs-grid">
          {collection.items.map((item: any) => (
            <div key={item._id} className="design-card">
              <Link href={`/design/${item._id}`} className="design-link">
                <div className="design-thumbnail">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title} />
                  ) : (
                    <div className="thumbnail-placeholder" />
                  )}
                </div>
                <div className="design-info">
                  <h3>{item.title}</h3>
                  <div className="design-stats">
                    <span>
                      <Eye size={14} />
                      {item.viewCount ?? 0}
                    </span>
                    <span>
                      <Heart size={14} />
                      {item.likeCount ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
              {isOwner && (
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item._id)}
                  title="Remove from collection"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back Link */}
      <div style={{ marginTop: "var(--space-2xl)" }}>
        <Link href="/collections" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Back to Collections
        </Link>
      </div>

      <style jsx>{`
        .collection-header {
          margin-bottom: var(--space-2xl);
        }

        .collection-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        .collection-title-row h1 {
          margin: 0;
          font-size: clamp(1.5rem, 3vw, 2rem);
        }

        .visibility-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.75rem;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: var(--radius);
        }

        .visibility-badge.public {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .visibility-badge.private {
          background: rgba(156, 163, 175, 0.15);
          color: var(--text-muted);
        }

        .collection-description {
          color: var(--text-secondary);
          margin: var(--space-md) 0;
          max-width: 600px;
        }

        .collection-meta {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .creator-link {
          color: var(--accent);
          text-decoration: none;
        }

        .creator-link:hover {
          text-decoration: underline;
        }

        .meta-divider {
          color: var(--border);
        }

        .designs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-lg);
        }

        .design-card {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .design-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .design-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .design-thumbnail {
          aspect-ratio: 16 / 9;
          background: var(--bg-deep);
          overflow: hidden;
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
          padding: var(--space-md);
        }

        .design-info h3 {
          margin: 0 0 var(--space-sm);
          font-size: 1rem;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .design-stats {
          display: flex;
          gap: var(--space-md);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .design-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .remove-btn {
          position: absolute;
          top: var(--space-sm);
          right: var(--space-sm);
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: var(--radius);
          padding: var(--space-xs);
          color: white;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .design-card:hover .remove-btn {
          opacity: 1;
        }

        .remove-btn:hover {
          background: #ef4444;
        }
      `}</style>
    </div>
  );
}
