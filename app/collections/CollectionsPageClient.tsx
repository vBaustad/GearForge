"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { FolderPlus, Lock, Globe, MoreVertical, Trash2, Edit, X } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/lib/auth";

export function CollectionsPageClient() {
  const { isAuthenticated, sessionToken, user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Get user's collections
  const myCollections = useQuery(
    api.collections.getByUser,
    user ? { userId: user.id } : "skip"
  );

  // Get public collections for discovery
  const publicCollections = useQuery(api.collections.listPublic, { limit: 20 });

  const createCollection = useMutation(api.collections.create);
  const deleteCollection = useMutation(api.collections.remove);

  const handleCreate = async () => {
    if (!sessionToken || !newName.trim()) return;
    setIsCreating(true);
    try {
      await createCollection({
        sessionToken,
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        isPublic: newIsPublic,
      });
      setShowCreateModal(false);
      setNewName("");
      setNewDescription("");
      setNewIsPublic(false);
    } catch (err) {
      console.error("Failed to create collection:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (collectionId: string) => {
    if (!sessionToken || !confirm("Delete this collection?")) return;
    try {
      await deleteCollection({ sessionToken, id: collectionId as any });
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <div className="container page-section">
      <Breadcrumbs items={[{ label: "Collections" }]} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xl)" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: "0.5rem" }}>
            Collections
          </h1>
          <p className="text-secondary">
            Organize and share curated sets of housing designs
          </p>
        </div>
        {isAuthenticated && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <FolderPlus size={18} />
            New Collection
          </button>
        )}
      </div>

      {/* My Collections */}
      {isAuthenticated && myCollections && (
        <section style={{ marginBottom: "var(--space-2xl)" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "var(--space-lg)" }}>
            My Collections
          </h2>
          {myCollections.length === 0 ? (
            <div className="card" style={{ padding: "var(--space-xl)", textAlign: "center" }}>
              <p className="text-muted">You haven&apos;t created any collections yet.</p>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(true)}
                style={{ marginTop: "var(--space-md)" }}
              >
                Create Your First Collection
              </button>
            </div>
          ) : (
            <div className="collections-grid">
              {myCollections.map((collection) => (
                <CollectionCard
                  key={collection._id}
                  collection={collection}
                  isOwner
                  onDelete={() => handleDelete(collection._id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Public Collections */}
      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "var(--space-lg)" }}>
          Discover Collections
        </h2>
        {!publicCollections ? (
          <div style={{ minHeight: "200px" }} />
        ) : publicCollections.length === 0 ? (
          <div className="card" style={{ padding: "var(--space-xl)", textAlign: "center" }}>
            <p className="text-muted">No public collections yet.</p>
          </div>
        ) : (
          <div className="collections-grid">
            {publicCollections.map((collection) => (
              <CollectionCard
                key={collection._id}
                collection={collection}
                showOwner
              />
            ))}
          </div>
        )}
      </section>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Collection</h2>
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Cozy Bedrooms"
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  className="input"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="A collection of cozy bedroom designs..."
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={newIsPublic}
                    onChange={(e) => setNewIsPublic(e.target.checked)}
                  />
                  <Globe size={16} />
                  Make this collection public
                </label>
                <p className="text-muted" style={{ fontSize: "0.75rem", marginTop: "var(--space-xs)" }}>
                  Public collections can be discovered by other users
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create Collection"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .collections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-lg);
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-lg);
        }

        .modal-content {
          background: var(--bg-elevated);
          border-radius: var(--radius-lg);
          max-width: 480px;
          width: 100%;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--border);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.125rem;
        }

        .modal-body {
          padding: var(--space-lg);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-sm);
          padding: var(--space-lg);
          border-top: 1px solid var(--border);
        }

        .form-group {
          margin-bottom: var(--space-md);
        }

        .form-group label {
          display: block;
          font-weight: 500;
          margin-bottom: var(--space-xs);
        }
      `}</style>
    </div>
  );
}

// Collection Card Component
function CollectionCard({
  collection,
  isOwner,
  showOwner,
  onDelete,
}: {
  collection: any;
  isOwner?: boolean;
  showOwner?: boolean;
  onDelete?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="collection-card">
      <Link href={`/collections/${collection._id}`} className="collection-link">
        {/* Thumbnail Grid */}
        <div className="collection-thumbnails">
          {collection.thumbnails?.slice(0, 4).map((url: string, i: number) => (
            <div key={i} className="thumbnail-item">
              <img src={url} alt="" />
            </div>
          ))}
          {(!collection.thumbnails || collection.thumbnails.length === 0) && (
            <div className="thumbnail-placeholder">
              <FolderPlus size={32} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="collection-info">
          <div className="collection-title-row">
            <h3>{collection.name}</h3>
            {!collection.isPublic && <Lock size={14} />}
          </div>
          {showOwner && collection.ownerName && (
            <p className="collection-owner">by {collection.ownerName}</p>
          )}
          <p className="collection-count">{collection.itemCount ?? 0} designs</p>
        </div>
      </Link>

      {/* Owner Actions */}
      {isOwner && (
        <div className="collection-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.preventDefault();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical size={16} />
          </button>
          {showMenu && (
            <>
              <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
              <div className="collection-menu">
                <Link href={`/collections/${collection._id}/edit`} className="menu-item">
                  <Edit size={14} />
                  Edit
                </Link>
                <button className="menu-item danger" onClick={onDelete}>
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .collection-card {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .collection-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .collection-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .collection-thumbnails {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2px;
          aspect-ratio: 16 / 9;
          background: var(--bg-deep);
        }

        .thumbnail-item {
          overflow: hidden;
        }

        .thumbnail-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          grid-column: span 2;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .collection-info {
          padding: var(--space-md);
        }

        .collection-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .collection-title-row h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .collection-owner {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: var(--space-xs) 0 0;
        }

        .collection-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: var(--space-xs) 0 0;
        }

        .collection-actions {
          position: absolute;
          top: var(--space-sm);
          right: var(--space-sm);
        }

        .menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10;
        }

        .collection-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 20;
          min-width: 120px;
          overflow: hidden;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          width: 100%;
          text-decoration: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .menu-item:hover {
          background: var(--surface-elevated);
        }

        .menu-item.danger {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}
