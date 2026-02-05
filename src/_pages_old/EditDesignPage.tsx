import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ArrowLeft, Save, Trash2, AlertCircle, X, Plus } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/types/creation";
import { useAuth } from "@/lib/auth";

export function EditDesignPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("bedroom");
  const [importString, setImportString] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creation = useQuery(
    api.creations.getById,
    id ? { id: id as Id<"creations"> } : "skip"
  );

  const updateCreation = useMutation(api.creations.update);
  const deleteCreation = useMutation(api.creations.remove);

  // Populate form when creation loads
  useEffect(() => {
    if (creation) {
      setTitle(creation.title);
      setDescription(creation.description || "");
      setCategory(creation.category as Category);
      setImportString(creation.importString);
      setTags(creation.tags);
    }
  }, [creation]);

  // Check ownership
  const isOwner = user && creation && creation.creatorId === user.id;

  // Loading state
  if (authLoading || creation === undefined) {
    return (
      <div className="container page-section">
        <div className="skeleton" style={{ height: '2rem', width: '200px', marginBottom: 'var(--space-xl)' }} />
        <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius)' }} />
      </div>
    );
  }

  // Not found
  if (creation === null) {
    return (
      <div className="container page-section">
        <div className="card empty-state">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Design Not Found
          </h2>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
            This design doesn't exist or has been removed.
          </p>
          <Link to="/browse" className="btn btn-primary">
            Browse Designs
          </Link>
        </div>
      </div>
    );
  }

  // Not authenticated or not owner
  if (!isAuthenticated || !isOwner) {
    return (
      <div className="container page-section">
        <div className="card empty-state">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Access Denied
          </h2>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
            You can only edit your own designs.
          </p>
          <Link to={`/design/${id}`} className="btn btn-primary">
            View Design
          </Link>
        </div>
      </div>
    );
  }

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

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!importString.trim()) {
      setError("Import string is required");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCreation({
        id: id as Id<"creations">,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        importString: importString.trim(),
        tags,
      });

      navigate(`/design/${id}`);
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update design. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCreation({ id: id as Id<"creations"> });
      navigate("/browse");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete design. Please try again.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="container page-section">
      {/* Back link */}
      <Link to={`/design/${id}`} className="back-link">
        <ArrowLeft size={16} />
        Back to Design
      </Link>

      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.5rem' }}>
          Edit Design
        </h1>
        <p className="text-secondary">
          Update your housing creation
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        {/* Error Message */}
        {error && (
          <div className="upload-error" style={{ marginBottom: 'var(--space-lg)' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Title */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title <span className="text-accent">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            maxLength={100}
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="category" className="form-label">
            Category <span className="text-accent">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="input"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input textarea"
            rows={4}
            maxLength={2000}
          />
          <p className="form-hint">{description.length}/2000 characters</p>
        </div>

        {/* Import String */}
        <div className="form-group">
          <label htmlFor="importString" className="form-label">
            Import String <span className="text-accent">*</span>
          </label>
          <textarea
            id="importString"
            value={importString}
            onChange={(e) => setImportString(e.target.value)}
            className="input textarea import-textarea"
            rows={4}
          />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label htmlFor="tags" className="form-label">
            Tags
          </label>
          <div className="tags-input-wrapper">
            <div className="tags-list">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                    aria-label={`Remove ${tag} tag`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="tags-input-row">
              <input
                id="tags"
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
                Add
              </button>
            </div>
          </div>
          <p className="form-hint">{tags.length}/10 tags</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)', flexWrap: 'wrap' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            <Save size={18} />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-ghost"
            style={{ color: '#f87171' }}
          >
            <Trash2 size={18} />
            Delete Design
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
              Delete Design?
            </h3>
            <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
              This action cannot be undone. Your design will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn"
                style={{ background: '#dc2626', color: 'white' }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
