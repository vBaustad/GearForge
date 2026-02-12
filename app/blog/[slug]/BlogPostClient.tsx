"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Calendar, Eye, ArrowLeft, User } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface BlogPostClientProps {
  slug: string;
}

export function BlogPostClient({ slug }: BlogPostClientProps) {
  const post = useQuery(api.blog.getBySlug, { slug });
  const incrementViews = useMutation(api.blog.incrementViews);

  // Increment views on mount
  useEffect(() => {
    if (post) {
      incrementViews({ slug });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (post === undefined) {
    return (
      <div className="container page-section">
        <div style={{ minHeight: "50vh" }} />
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <h2 style={{ marginBottom: "var(--space-md)" }}>Post Not Found</h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            This blog post doesn&apos;t exist or has been removed.
          </p>
          <Link href="/blog" className="btn btn-primary">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <Breadcrumbs
        items={[{ label: "Blog", href: "/blog" }, { label: post.title }]}
      />

      <article className="blog-post">
        {/* Header */}
        <header className="post-header">
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="post-tag"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <h1 className="post-title">{post.title}</h1>

          <div className="post-meta">
            <div className="author-info">
              {post.authorAvatarUrl ? (
                <img
                  src={post.authorAvatarUrl}
                  alt={post.authorName}
                  className="author-avatar"
                />
              ) : (
                <div className="author-avatar-placeholder">
                  <User size={16} />
                </div>
              )}
              <span>{post.authorName}</span>
            </div>
            <span className="meta-divider">·</span>
            <span className="meta-item">
              <Calendar size={14} />
              {new Date(post.publishedAt!).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="meta-divider">·</span>
            <span className="meta-item">
              <Eye size={14} />
              {post.viewCount} views
            </span>
          </div>
        </header>

        {/* Cover Image */}
        {post.coverUrl && (
          <div className="post-cover">
            <img src={post.coverUrl} alt={post.title} />
          </div>
        )}

        {/* Content */}
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(post.content) }}
        />

        {/* Footer */}
        <footer className="post-footer">
          <Link href="/blog" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Back to Blog
          </Link>
        </footer>
      </article>

      <style jsx>{`
        .blog-post {
          max-width: 720px;
          margin: 0 auto;
        }

        .post-header {
          text-align: center;
          margin-bottom: var(--space-2xl);
        }

        .post-tags {
          display: flex;
          justify-content: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .post-tag {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 12px;
          background: rgba(212, 145, 92, 0.15);
          color: var(--accent);
          border-radius: var(--radius);
          text-decoration: none;
          transition: background 0.15s ease;
        }

        .post-tag:hover {
          background: rgba(212, 145, 92, 0.25);
        }

        .post-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700;
          line-height: 1.2;
          margin: 0 0 var(--space-lg);
        }

        .post-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: var(--space-sm);
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .author-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .author-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
        }

        .author-avatar-placeholder {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--surface-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .meta-divider {
          color: var(--border);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .post-cover {
          margin-bottom: var(--space-2xl);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .post-cover img {
          width: 100%;
          height: auto;
        }

        .post-content {
          font-size: 1.0625rem;
          line-height: 1.8;
          color: var(--text-secondary);
        }

        .post-content :global(h2) {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: var(--space-2xl) 0 var(--space-md);
        }

        .post-content :global(h3) {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: var(--space-xl) 0 var(--space-md);
        }

        .post-content :global(p) {
          margin: 0 0 var(--space-lg);
        }

        .post-content :global(ul),
        .post-content :global(ol) {
          margin: 0 0 var(--space-lg);
          padding-left: var(--space-xl);
        }

        .post-content :global(li) {
          margin-bottom: var(--space-sm);
        }

        .post-content :global(blockquote) {
          border-left: 4px solid var(--accent);
          padding-left: var(--space-lg);
          margin: var(--space-lg) 0;
          font-style: italic;
          color: var(--text-muted);
        }

        .post-content :global(code) {
          background: var(--bg-deep);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.9em;
          font-family: var(--font-mono, monospace);
        }

        .post-content :global(pre) {
          background: var(--bg-deep);
          padding: var(--space-md);
          border-radius: var(--radius);
          overflow-x: auto;
          margin: 0 0 var(--space-lg);
        }

        .post-content :global(pre code) {
          background: none;
          padding: 0;
        }

        .post-content :global(img) {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius);
          margin: var(--space-lg) 0;
        }

        .post-content :global(a) {
          color: var(--accent);
          text-decoration: underline;
        }

        .post-content :global(a:hover) {
          text-decoration: none;
        }

        .post-footer {
          margin-top: var(--space-2xl);
          padding-top: var(--space-xl);
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}

// Simple markdown to HTML formatter
function formatMarkdown(content: string): string {
  return (
    content
      // Headers
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
      // Inline code
      .replace(/`(.*?)`/g, "<code>$1</code>")
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
      // Blockquotes
      .replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>")
      // Unordered lists
      .replace(/^- (.*)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
      // Ordered lists
      .replace(/^\d+\. (.*)$/gm, "<li>$1</li>")
      // Paragraphs
      .replace(/\n\n/g, "</p><p>")
      .replace(/^([^<\n].+)$/gm, "<p>$1</p>")
      // Clean up
      .replace(/<p><\/p>/g, "")
      .replace(/<p>(<h[23]>)/g, "$1")
      .replace(/(<\/h[23]>)<\/p>/g, "$1")
      .replace(/<p>(<ul>)/g, "$1")
      .replace(/(<\/ul>)<\/p>/g, "$1")
      .replace(/<p>(<blockquote>)/g, "$1")
      .replace(/(<\/blockquote>)<\/p>/g, "$1")
  );
}
