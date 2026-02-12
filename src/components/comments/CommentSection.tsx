"use client";

import { MessageSquare, LogIn } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Comment } from "./Comment";
import { CommentForm } from "./CommentForm";
import Link from "next/link";

interface CommentSectionProps {
  creationId: Id<"creations">;
  sessionToken?: string;
  currentUserId?: Id<"users">;
}

export function CommentSection({
  creationId,
  sessionToken,
  currentUserId,
}: CommentSectionProps) {
  const comments = useQuery(api.comments.getByCreation, {
    creationId,
    limit: 50,
  });

  const commentCount = useQuery(api.comments.getCount, { creationId });

  const isLoading = comments === undefined;

  return (
    <div style={{ marginTop: "var(--space-2xl)" }}>
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-lg)",
          fontSize: "1.25rem",
        }}
      >
        <MessageSquare size={22} />
        Comments
        {commentCount !== undefined && commentCount > 0 && (
          <span
            className="text-muted"
            style={{ fontWeight: 400, fontSize: "1rem" }}
          >
            ({commentCount})
          </span>
        )}
      </h2>

      {/* Comment Form */}
      {sessionToken ? (
        <div style={{ marginBottom: "var(--space-xl)" }}>
          <CommentForm
            creationId={creationId}
            sessionToken={sessionToken}
            placeholder="Share your thoughts on this design..."
          />
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: "var(--space-lg)",
            marginBottom: "var(--space-xl)",
            textAlign: "center",
            background: "var(--bg-surface)",
          }}
        >
          <LogIn
            size={32}
            style={{ color: "var(--text-muted)", marginBottom: "var(--space-sm)" }}
          />
          <p className="text-secondary" style={{ marginBottom: "var(--space-sm)" }}>
            Log in to join the conversation
          </p>
          <Link href="/" className="btn btn-primary btn-sm">
            Log In
          </Link>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: "var(--space-md)",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius)",
              }}
            >
              <div
                className="skeleton"
                style={{
                  height: 16,
                  width: 120,
                  marginBottom: "var(--space-sm)",
                }}
              />
              <div
                className="skeleton"
                style={{
                  height: 48,
                  width: "100%",
                }}
              />
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          {comments.map((comment) => (
            <Comment
              key={comment._id}
              comment={comment}
              creationId={creationId}
              sessionToken={sessionToken}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: "var(--space-xl)",
            textAlign: "center",
            background: "var(--bg-surface)",
          }}
        >
          <MessageSquare
            size={48}
            style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)" }}
          />
          <p className="text-muted">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
}
