import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ArrowLeft, Lock, Globe, FolderOpen } from "lucide-react";
import { DesignCard } from "@/components/DesignCard";
import { useAuth } from "@/lib/auth";

export function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const collection = useQuery(
    api.collections.getById,
    id ? { id: id as Id<"collections"> } : "skip"
  );

  // Loading state
  if (collection === undefined) {
    return <div className="container page-section" style={{ minHeight: '50vh' }} />;
  }

  // Not found or private
  if (collection === null) {
    return (
      <div className="container page-section">
        <div className="card empty-state">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Collection Not Found
          </h2>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
            This collection doesn't exist or is private.
          </p>
          <Link to="/browse" className="btn btn-primary">
            Browse Designs
          </Link>
        </div>
      </div>
    );
  }

  // Check access - private collections only visible to owner
  const isOwner = user?.id === collection.ownerId;
  if (!collection.isPublic && !isOwner) {
    return (
      <div className="container page-section">
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Private Collection
          </h2>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
            This collection is private.
          </p>
          <Link to="/browse" className="btn btn-primary">
            Browse Designs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-section">
      {/* Back link */}
      <Link to={`/user/${collection.ownerId}`} className="back-link">
        <ArrowLeft size={16} />
        Back to Profile
      </Link>

      {/* Collection Header */}
      <div className="collection-header">
        <div className="collection-header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <FolderOpen size={20} className="text-accent" />
            {collection.isPublic ? (
              <span className="badge"><Globe size={10} /> Public</span>
            ) : (
              <span className="badge badge-outline"><Lock size={10} /> Private</span>
            )}
          </div>
        </div>
        <h1 className="font-display" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 'var(--space-sm)' }}>
          {collection.name}
        </h1>
        {collection.description && (
          <p className="text-secondary" style={{ marginBottom: 'var(--space-md)' }}>
            {collection.description}
          </p>
        )}
        <p className="text-muted">
          Created by{" "}
          <Link to={`/user/${collection.ownerId}`} className="text-accent">
            {collection.ownerName}
          </Link>
          {" "}• {collection.items.length} design{collection.items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Collection Items */}
      <div style={{ marginTop: 'var(--space-xl)' }}>
        {collection.items.length === 0 ? (
          <div className="card empty-state">
            <p className="text-secondary">
              This collection is empty.
            </p>
            {isOwner && (
              <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                Add designs from the design pages.
              </p>
            )}
          </div>
        ) : (
          <div className="gallery-grid">
            {collection.items.map((item: any) => (
              <DesignCard
                key={item._id}
                id={item._id}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                category={item.category}
                creatorName={item.creatorName}
                likeCount={item.likeCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
