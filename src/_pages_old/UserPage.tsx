import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { User, Calendar, ArrowLeft, Heart, Grid, ExternalLink, Settings, Bookmark, FolderOpen, Plus, Lock, Globe, Trash2, UserPlus, UserCheck, Users, BarChart3, Eye, TrendingUp } from "lucide-react";
import { DesignCard } from "@/components/DesignCard";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/lib/auth";

// Twitch icon
function TwitchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  );
}

// YouTube icon
function YouTubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

type Tab = "designs" | "likes" | "saved" | "collections" | "following" | "stats";

export function UserPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("designs");
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === id;

  const user = useQuery(
    api.users.getById,
    id ? { id: id as Id<"users"> } : "skip"
  );

  const creations = useQuery(
    api.creations.getByCreator,
    id ? { creatorId: id as Id<"users"> } : "skip"
  );

  const likedCreations = useQuery(
    api.likes.getLikedCreations,
    id ? { userId: id as Id<"users"> } : "skip"
  );

  // Only fetch saved creations if viewing own profile
  const savedCreations = useQuery(
    api.saves.getSavedCreations,
    isOwnProfile && id ? { userId: id as Id<"users"> } : "skip"
  );

  // Fetch collections
  const collections = useQuery(
    api.collections.getByUser,
    id ? { userId: id as Id<"users"> } : "skip"
  );

  // Follow data
  const followStats = useQuery(
    api.follows.getStats,
    id ? { userId: id as Id<"users"> } : "skip"
  );

  const isFollowing = useQuery(
    api.follows.isFollowing,
    currentUser && id && currentUser.id !== id
      ? { followerId: currentUser.id, followingId: id as Id<"users"> }
      : "skip"
  );

  const followingList = useQuery(
    api.follows.getFollowing,
    id ? { userId: id as Id<"users"> } : "skip"
  );

  const toggleFollow = useMutation(api.follows.toggle);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  // Creator stats - only for own profile
  const creatorStats = useQuery(
    api.users.getCreatorStats,
    isOwnProfile && id ? { userId: id as Id<"users"> } : "skip"
  );

  const handleToggleFollow = async () => {
    if (!currentUser || !id || isTogglingFollow) return;
    setIsTogglingFollow(true);
    try {
      await toggleFollow({
        followerId: currentUser.id,
        followingId: id as Id<"users">,
      });
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  // Collection mutations
  const createCollection = useMutation(api.collections.create);
  const deleteCollection = useMutation(api.collections.remove);

  // Create collection modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [newCollectionPublic, setNewCollectionPublic] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !currentUser) return;
    setIsCreatingCollection(true);
    try {
      await createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim() || undefined,
        ownerId: currentUser.id,
        isPublic: newCollectionPublic,
      });
      setShowCreateModal(false);
      setNewCollectionName("");
      setNewCollectionDesc("");
      setNewCollectionPublic(false);
    } catch (err) {
      console.error("Failed to create collection:", err);
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleDeleteCollection = async (collectionId: Id<"collections">) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    try {
      await deleteCollection({ id: collectionId });
    } catch (err) {
      console.error("Failed to delete collection:", err);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  // Loading state - just show empty container to prevent flash
  if (user === undefined || creations === undefined || likedCreations === undefined) {
    return <div className="container page-section" style={{ minHeight: '50vh' }} />;
  }

  // Not found
  if (user === null) {
    return (
      <div className="container page-section">
        <div className="card empty-state">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            User Not Found
          </h2>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
            This user doesn't exist or has been removed.
          </p>
          <Link to="/browse" className="btn btn-primary">
            Browse Designs
          </Link>
        </div>
      </div>
    );
  }

  const battleTagName = user.battleTag.split("#")[0];

  // SEO description
  const designCount = creations?.length ?? 0;
  const seoDescription = user.bio
    ? user.bio.slice(0, 155)
    : `${battleTagName}'s WoW housing designs on GearForge. Browse ${designCount} creation${designCount !== 1 ? "s" : ""} and get inspired.`;

  return (
    <>
      <SEO
        title={`${battleTagName} - WoW Housing Creator`}
        description={seoDescription}
        url={`/user/${id}`}
        image={user.avatarUrl || undefined}
      />
      <div className="container page-section">
        {/* Back link */}
        <Link to="/browse" className="back-link">
        <ArrowLeft size={16} />
        Back to Browse
      </Link>

      {/* User Header */}
      <div className="user-header">
        <div className="user-avatar-large">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.battleTag} />
          ) : (
            <User size={40} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <h1 className="font-display" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.25rem' }}>
              {battleTagName}
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              {isOwnProfile ? (
                <Link to="/profile/edit" className="btn btn-secondary">
                  <Settings size={16} />
                  Edit Profile
                </Link>
              ) : currentUser && (
                <button
                  onClick={handleToggleFollow}
                  disabled={isTogglingFollow}
                  className={`btn ${isFollowing ? "btn-secondary" : "btn-primary"}`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={16} />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-secondary" style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
              {user.bio}
            </p>
          )}

          <div className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={14} />
              Joined {formatDate(user.createdAt)}
            </span>
            <span>{creations.length} design{creations.length !== 1 ? "s" : ""}</span>
            {followStats && (
              <>
                <span>{followStats.followers} follower{followStats.followers !== 1 ? "s" : ""}</span>
                <span>{followStats.following} following</span>
              </>
            )}
          </div>

          {/* Social Links */}
          {(user.twitchUrl || user.youtubeUrl) && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              {user.twitchUrl && (
                <a
                  href={user.twitchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                >
                  <TwitchIcon size={14} />
                  Twitch
                  <ExternalLink size={12} />
                </a>
              )}
              {user.youtubeUrl && (
                <a
                  href={user.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                >
                  <YouTubeIcon size={14} />
                  YouTube
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          onClick={() => setActiveTab("designs")}
          className={`profile-tab ${activeTab === "designs" ? "active" : ""}`}
        >
          <Grid size={16} />
          Designs ({creations.length})
        </button>
        <button
          onClick={() => setActiveTab("likes")}
          className={`profile-tab ${activeTab === "likes" ? "active" : ""}`}
        >
          <Heart size={16} />
          Liked ({likedCreations.length})
        </button>
        {/* Saved tab - only visible on own profile */}
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab("saved")}
            className={`profile-tab ${activeTab === "saved" ? "active" : ""}`}
          >
            <Bookmark size={16} />
            Saved ({savedCreations?.length ?? 0})
          </button>
        )}
        {/* Collections tab */}
        <button
          onClick={() => setActiveTab("collections")}
          className={`profile-tab ${activeTab === "collections" ? "active" : ""}`}
        >
          <FolderOpen size={16} />
          Collections ({collections?.length ?? 0})
        </button>
        {/* Following tab */}
        <button
          onClick={() => setActiveTab("following")}
          className={`profile-tab ${activeTab === "following" ? "active" : ""}`}
        >
          <Users size={16} />
          Following ({followStats?.following ?? 0})
        </button>
        {/* Stats tab - only for own profile */}
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab("stats")}
            className={`profile-tab ${activeTab === "stats" ? "active" : ""}`}
          >
            <BarChart3 size={16} />
            Stats
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        {activeTab === "designs" && (
          creations.length === 0 ? (
            <div className="card empty-state">
              <p className="text-secondary">
                No designs uploaded yet.
              </p>
            </div>
          ) : (
            <div className="gallery-grid">
              {creations.map((creation) => (
                <DesignCard
                  key={creation._id}
                  id={creation._id}
                  title={creation.title}
                  thumbnailUrl={creation.thumbnailUrl}
                  category={creation.category}
                  creatorName={battleTagName}
                  likeCount={creation.likeCount}
                />
              ))}
            </div>
          )
        )}

        {activeTab === "likes" && (
          likedCreations.length === 0 ? (
            <div className="card empty-state">
              <p className="text-secondary">
                No liked designs yet.
              </p>
            </div>
          ) : (
            <div className="gallery-grid">
              {likedCreations.map((creation: any) => (
                <DesignCard
                  key={creation._id}
                  id={creation._id}
                  title={creation.title}
                  thumbnailUrl={creation.thumbnailUrl}
                  category={creation.category}
                  creatorName={creation.creatorName}
                  likeCount={creation.likeCount}
                />
              ))}
            </div>
          )
        )}

        {activeTab === "saved" && isOwnProfile && (
          !savedCreations || savedCreations.length === 0 ? (
            <div className="card empty-state">
              <p className="text-secondary">
                No saved designs yet.
              </p>
              <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                Bookmark designs to find them here later.
              </p>
            </div>
          ) : (
            <div className="gallery-grid">
              {savedCreations.map((creation: any) => (
                <DesignCard
                  key={creation._id}
                  id={creation._id}
                  title={creation.title}
                  thumbnailUrl={creation.thumbnailUrl}
                  category={creation.category}
                  creatorName={creation.creatorName}
                  likeCount={creation.likeCount}
                />
              ))}
            </div>
          )
        )}

        {activeTab === "collections" && (
          <>
            {/* Create collection button - only for own profile */}
            {isOwnProfile && (
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  Create Collection
                </button>
              </div>
            )}

            {!collections || collections.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-state-icon">
                  <FolderOpen size={28} />
                </div>
                <p className="text-secondary">
                  No collections yet.
                </p>
                {isOwnProfile && (
                  <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                    Create collections to organize your favorite designs.
                  </p>
                )}
              </div>
            ) : (
              <div className="collections-grid">
                {collections
                  .filter((c) => isOwnProfile || c.isPublic)
                  .map((collection) => (
                    <Link
                      key={collection._id}
                      to={`/collection/${collection._id}`}
                      className="collection-card"
                    >
                      <div className="collection-card-thumbnails">
                        {collection.thumbnails.length > 0 ? (
                          collection.thumbnails.slice(0, 4).map((url, i) => (
                            <img key={i} src={url} alt="" />
                          ))
                        ) : (
                          <div className="collection-card-empty">
                            <FolderOpen size={24} />
                          </div>
                        )}
                      </div>
                      <div className="collection-card-content">
                        <div className="collection-card-header">
                          <h3>{collection.name}</h3>
                          {!collection.isPublic && <Lock size={12} />}
                        </div>
                        <p className="text-muted">{collection.itemCount} design{collection.itemCount !== 1 ? "s" : ""}</p>
                      </div>
                      {isOwnProfile && (
                        <button
                          className="collection-card-delete"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteCollection(collection._id as Id<"collections">);
                          }}
                          aria-label="Delete collection"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </Link>
                  ))}
              </div>
            )}
          </>
        )}

        {activeTab === "following" && (
          !followingList || followingList.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">
                <Users size={28} />
              </div>
              <p className="text-secondary">
                Not following anyone yet.
              </p>
            </div>
          ) : (
            <div className="following-grid">
              {followingList.map((followedUser: any) => (
                <Link
                  key={followedUser._id}
                  to={`/user/${followedUser._id}`}
                  className="following-card"
                >
                  <div className="following-card-avatar">
                    {followedUser.avatarUrl ? (
                      <img src={followedUser.avatarUrl} alt={followedUser.battleTag} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <span className="following-card-name">
                    {followedUser.battleTag.split("#")[0]}
                  </span>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === "stats" && isOwnProfile && creatorStats && (
          <div className="stats-dashboard">
            {/* Overview Cards */}
            <div className="stats-overview">
              <div className="stat-card">
                <div className="stat-card-icon">
                  <Grid size={20} />
                </div>
                <div className="stat-card-content">
                  <span className="stat-card-value">{creatorStats.totalDesigns}</span>
                  <span className="stat-card-label">Designs</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">
                  <Heart size={20} />
                </div>
                <div className="stat-card-content">
                  <span className="stat-card-value">{creatorStats.totalLikes}</span>
                  <span className="stat-card-label">Total Likes</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">
                  <Eye size={20} />
                </div>
                <div className="stat-card-content">
                  <span className="stat-card-value">{creatorStats.totalViews}</span>
                  <span className="stat-card-label">Total Views</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">
                  <TrendingUp size={20} />
                </div>
                <div className="stat-card-content">
                  <span className="stat-card-value">{creatorStats.avgLikesPerDesign}</span>
                  <span className="stat-card-label">Avg. Likes</span>
                </div>
              </div>
            </div>

            {/* Most Popular Design */}
            {creatorStats.mostPopularDesign && (
              <div className="stats-section">
                <h3>Most Popular Design</h3>
                <Link to={`/design/${creatorStats.mostPopularDesign._id}`} className="stats-popular-card">
                  {creatorStats.mostPopularDesign.thumbnailUrl && (
                    <img
                      src={creatorStats.mostPopularDesign.thumbnailUrl}
                      alt={creatorStats.mostPopularDesign.title}
                      className="stats-popular-image"
                    />
                  )}
                  <div className="stats-popular-content">
                    <span className="stats-popular-title">{creatorStats.mostPopularDesign.title}</span>
                    <div className="stats-popular-stats">
                      <span><Heart size={14} /> {creatorStats.mostPopularDesign.likeCount}</span>
                      <span><Eye size={14} /> {creatorStats.mostPopularDesign.viewCount}</span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Category Breakdown */}
            {creatorStats.categoryBreakdown.length > 0 && (
              <div className="stats-section">
                <h3>Designs by Category</h3>
                <div className="stats-categories">
                  {creatorStats.categoryBreakdown.map(({ category, count }) => (
                    <div key={category} className="stats-category-item">
                      <span className="stats-category-name">{category.replace("_", " ")}</span>
                      <div className="stats-category-bar-wrap">
                        <div
                          className="stats-category-bar"
                          style={{
                            width: `${(count / creatorStats.totalDesigns) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="stats-category-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
              Create Collection
            </h3>

            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Cozy Bedrooms"
                className="input"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                placeholder="What's this collection about?"
                className="input textarea"
                rows={2}
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newCollectionPublic}
                  onChange={(e) => setNewCollectionPublic(e.target.checked)}
                />
                <Globe size={14} />
                Make this collection public
              </label>
              <p className="form-hint">
                Public collections can be viewed by anyone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
                disabled={isCreatingCollection}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                className="btn btn-primary"
                disabled={!newCollectionName.trim() || isCreatingCollection}
              >
                {isCreatingCollection ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
