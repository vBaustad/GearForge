import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Upload, Image, X, Plus, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/types/creation";
import { useAuth } from "@/lib/auth";
import { BlizzardLoginButton } from "@/components/BlizzardLoginButton";
import { ItemPicker, type SelectedItem } from "@/components/ItemPicker";
import { SEO } from "@/components/SEO";

export function UploadPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("bedroom");
  const [importString, setImportString] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
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

  // Show login prompt if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="container page-section">
        <div className="card empty-state">
          <div className="empty-state-icon" style={{ background: 'linear-gradient(180deg, #148eff 0%, #0074e0 100%)' }}>
            <Upload size={28} style={{ color: 'white' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Login Required
          </h2>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)', maxWidth: '320px' }}>
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

    if (!user) {
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
        const uploadUrl = await generateUploadUrl();
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

      // Create the design
      const creationId = await createCreation({
        title: title.trim(),
        description: description.trim() || undefined,
        importString: importString.trim(),
        imageIds: imageIds as any, // Type cast for Convex ID
        category,
        tags,
        items: selectedItems.map((item) => ({
          decorId: item.decorId,
          quantity: item.quantity,
        })),
        creatorId: user.id,
      });

      // Show success message and redirect to the new design
      setUploadSuccess(creationId);
      setTimeout(() => {
        navigate(`/design/${creationId}`);
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - show briefly before redirect
  if (uploadSuccess) {
    return (
      <div className="container page-section">
        <div className="card empty-state" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div className="empty-state-icon" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
            <CheckCircle size={32} style={{ color: '#22c55e' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
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
    <>
      <SEO
        title="Upload Design"
        description="Share your World of Warcraft housing design with the community. Upload screenshots and import strings."
        url="/upload"
        noindex
      />
      <div className="container page-section">
        {/* Page Header */}
        <div className="upload-header">
          <h1 className="font-display">Upload Design</h1>
          <p className="text-secondary">Share your housing creation with the community</p>
        </div>

      {/* Error/Warning Messages */}
      {error && (
        <div className="upload-error" style={{ marginBottom: 'var(--space-lg)' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {duplicateCheck && (
        <div className="duplicate-warning" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="duplicate-warning-header">
            <AlertTriangle size={20} />
            <span>This design may already exist</span>
          </div>
          <div className="duplicate-warning-content">
            <Link to={`/design/${duplicateCheck._id}`} className="duplicate-card">
              {duplicateCheck.thumbnailUrl && (
                <img
                  src={duplicateCheck.thumbnailUrl}
                  alt={duplicateCheck.title}
                  className="duplicate-card-image"
                />
              )}
              <div className="duplicate-card-info">
                <span className="duplicate-card-title">{duplicateCheck.title}</span>
                <span className="duplicate-card-creator">by {duplicateCheck.creatorName}</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="upload-grid">
          {/* LEFT COLUMN */}
          <div className="upload-col">
            {/* Basic Info */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Info</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    Title <span className="text-accent">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Cozy Tavern Corner"
                    className="input"
                    maxLength={100}
                  />
                </div>
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
              </div>
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your design..."
                  className="input textarea"
                  rows={3}
                  maxLength={2000}
                />
              </div>
              <div className="form-group">
                <label htmlFor="importString" className="form-label">
                  Import String <span className="text-accent">*</span>
                </label>
                <input
                  id="importString"
                  type="text"
                  value={importString}
                  onChange={(e) => setImportString(e.target.value)}
                  placeholder="Paste your housing import string here..."
                  className="input"
                />
              </div>

              {/* Tags - inline in Basic Info */}
              <div className="form-group">
                <label className="form-label">Tags</label>
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
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="tags-list" style={{ marginTop: 'var(--space-sm)' }}>
                    {tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="tag-remove">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Items Used */}
            <div className="form-section">
              <h3 className="form-section-title">Items Used</h3>
              <ItemPicker
                selectedItems={selectedItems}
                onItemsChange={setSelectedItems}
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="upload-col">
            {/* Preview Card */}
            <div className="form-section">
              <h3 className="form-section-title">Preview</h3>
              <div className="upload-preview-card">
                {imagePreviews.length > 0 ? (
                  <img
                    src={imagePreviews[0]}
                    alt="Design preview"
                    className="upload-preview-image"
                  />
                ) : (
                  <div className="upload-preview-placeholder">
                    <Image size={32} />
                    <span>Upload a screenshot to see preview</span>
                  </div>
                )}
                <div className="upload-preview-info">
                  <h4 className="upload-preview-title">
                    {title || "Your Design Title"}
                  </h4>
                  <div className="upload-preview-meta">
                    <span className="badge">{CATEGORY_LABELS[category]}</span>
                    {tags.length > 0 && (
                      <span className="text-muted">{tags.length} tags</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Screenshots */}
            <div className="form-section">
              <h3 className="form-section-title">Screenshots <span className="text-accent">*</span></h3>
              <div className="image-grid-upload">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-upload">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="image-remove"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                    {index === 0 && <span className="image-thumbnail-badge">Thumbnail</span>}
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="image-upload-btn-upload">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <Image size={24} />
                    <span>Add Screenshot</span>
                    <span className="text-muted">{images.length}/5</span>
                  </label>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Uploading..." : <><Upload size={18} /> Upload Design</>}
            </button>
          </div>
        </div>
      </form>
      </div>
    </>
  );
}
