"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Calendar, Eye, Tag } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function BlogPageClient() {
  const posts = useQuery(api.blog.listPublished, { limit: 20 });
  const tags = useQuery(api.blog.getTags);

  return (
    <div className="container page-section">
      <Breadcrumbs items={[{ label: "Blog" }]} />

      <div className="blog-layout">
        {/* Main Content */}
        <main className="blog-main">
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: "0.5rem" }}>
            Blog
          </h1>
          <p className="text-secondary" style={{ marginBottom: "var(--space-2xl)" }}>
            Tips, guides, and news about WoW housing
          </p>

          {!posts ? (
            <div style={{ minHeight: "300px" }} />
          ) : posts.length === 0 ? (
            <div className="card" style={{ padding: "var(--space-xl)", textAlign: "center" }}>
              <p className="text-muted">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="blog-grid">
              {posts.map((post, index) => (
                <article
                  key={post._id}
                  className={`blog-card ${index === 0 ? "featured" : ""}`}
                >
                  <Link href={`/blog/${post.slug}`} className="blog-link">
                    {/* Cover Image */}
                    <div className="blog-cover">
                      {post.coverUrl ? (
                        <img src={post.coverUrl} alt={post.title} />
                      ) : (
                        <div className="cover-placeholder">
                          <span>GF</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="blog-content">
                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="blog-tags">
                          {post.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="blog-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <h2 className="blog-title">{post.title}</h2>
                      <p className="blog-excerpt">{post.excerpt}</p>

                      {/* Meta */}
                      <div className="blog-meta">
                        <span>
                          <Calendar size={14} />
                          {new Date(post.publishedAt!).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>
                          <Eye size={14} />
                          {post.viewCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="blog-sidebar">
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="sidebar-section">
              <h3>
                <Tag size={16} />
                Topics
              </h3>
              <div className="sidebar-tags">
                {tags.slice(0, 15).map(({ tag, count }) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="sidebar-tag"
                  >
                    {tag}
                    <span className="tag-count">{count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <style jsx>{`
        .blog-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: var(--space-2xl);
        }

        @media (max-width: 900px) {
          .blog-layout {
            grid-template-columns: 1fr;
          }
        }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--space-lg);
        }

        .blog-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .blog-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .blog-card.featured {
          grid-column: span 2;
        }

        @media (max-width: 700px) {
          .blog-card.featured {
            grid-column: span 1;
          }
        }

        .blog-link {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .featured .blog-link {
          flex-direction: row;
        }

        @media (max-width: 700px) {
          .featured .blog-link {
            flex-direction: column;
          }
        }

        .blog-cover {
          aspect-ratio: 16 / 9;
          background: var(--bg-deep);
          overflow: hidden;
        }

        .featured .blog-cover {
          aspect-ratio: auto;
          width: 50%;
          min-height: 250px;
        }

        @media (max-width: 700px) {
          .featured .blog-cover {
            width: 100%;
            aspect-ratio: 16 / 9;
            min-height: auto;
          }
        }

        .blog-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .blog-content {
          padding: var(--space-lg);
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .featured .blog-content {
          width: 50%;
          justify-content: center;
        }

        @media (max-width: 700px) {
          .featured .blog-content {
            width: 100%;
          }
        }

        .blog-tags {
          display: flex;
          gap: var(--space-xs);
          margin-bottom: var(--space-sm);
        }

        .blog-tag {
          font-size: 0.6875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          background: rgba(212, 145, 92, 0.15);
          color: var(--accent);
          border-radius: var(--radius-sm);
        }

        .blog-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 var(--space-sm);
          line-height: 1.3;
        }

        .featured .blog-title {
          font-size: 1.5rem;
        }

        .blog-excerpt {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .blog-meta {
          display: flex;
          gap: var(--space-md);
          margin-top: var(--space-md);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .blog-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Sidebar */
        .blog-sidebar {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        @media (max-width: 900px) {
          .blog-sidebar {
            display: none;
          }
        }

        .sidebar-section h3 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: var(--space-md);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .sidebar-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .sidebar-tag {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-xs) var(--space-sm);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 0.8125rem;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .sidebar-tag:hover {
          background: var(--surface-elevated);
          color: var(--text-primary);
        }

        .tag-count {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
