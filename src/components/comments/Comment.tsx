"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Heart, MessageSquare, MoreVertical, Pencil, Trash2, Clock } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CommentForm } from "./CommentForm";
import { getErrorMessage } from "@/lib/errorMessages";

interface CommentAuthor {
  _id: Id<"users">;
  battleTag: string;
  avatarUrl?: string;
}

interface CommentReply {
  _id: Id<"comments">;
  content: string;
  likeCount: number;
  createdAt: number;
  editedAt?: number;
  author: CommentAuthor | null;
}

interface CommentData {
  _id: Id<"comments">;
  creationId: Id<"creations">;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: number;
  editedAt?: number;
  author: CommentAuthor | null;
  replies: CommentReply[];
}

interface CommentProps {
  comment: CommentData | CommentReply;
  creationId: Id<"creations">;
  sessionToken?: string;
  currentUserId?: Id<"users">;
  isReply?: boolean;
  onDeleted?: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

export function Comment({
  comment,
  creationId,
  sessionToken,
  currentUserId,
  isReply = false,
  onDeleted,
}: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleLike = useMutation(api.comments.toggleLike);
  const editComment = useMutation(api.comments.edit);
  const removeComment = useMutation(api.comments.remove);

  // Check if user has liked this comment
  const hasLiked = useQuery(
    api.comments.hasLiked,
    currentUserId ? { userId: currentUserId, commentId: comment._id } : "skip"
  );

  const isOwner = currentUserId && comment.author?._id === currentUserId;
  const canEdit =
    isOwner && Date.now() - comment.createdAt < 15 * 60 * 1000; // 15 minutes

  const handleToggleLike = async () => {
    if (!sessionToken || isLiking) return;

    setIsLiking(true);
    try {
      await toggleLike({
        sessionToken,
        commentId: comment._id,
      });
    } catch (err) {
      console.error("Failed to toggle like:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = async () => {
    if (!sessionToken || !editContent.trim()) return;

    try {
      await editComment({
        sessionToken,
        commentId: comment._id,
        content: editContent.trim(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to edit comment:", err);
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!sessionToken || isDeleting) return;

    if (!confirm("Are you sure you want to delete this comment?")) return;

    setIsDeleting(true);
    try {
      await removeComment({
        sessionToken,
        commentId: comment._id,
      });
      onDeleted?.();
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const replies = "replies" in comment ? comment.replies : [];

  return (
    <div
      style={{
        paddingLeft: isReply ? "var(--space-lg)" : 0,
        borderLeft: isReply ? "2px solid var(--border)" : "none",
        marginLeft: isReply ? "var(--space-md)" : 0,
      }}
    >
      <div
        style={{
          padding: "var(--space-md)",
          background: isReply ? "transparent" : "var(--bg-surface)",
          borderRadius: isReply ? 0 : "var(--radius)",
          marginBottom: "var(--space-sm)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            {/* Avatar */}
            <Link
              href={comment.author ? `/user/${comment.author._id}` : "#"}
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {comment.author?.avatarUrl ? (
                <img
                  src={comment.author.avatarUrl}
                  alt={comment.author.battleTag}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <User size={16} style={{ color: "var(--text-muted)" }} />
              )}
            </Link>

            {/* Name and time */}
            <div>
              <Link
                href={comment.author ? `/user/${comment.author._id}` : "#"}
                style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: "var(--text-primary)",
                  textDecoration: "none",
                }}
              >
                {comment.author?.battleTag.split("#")[0] ?? "Unknown User"}
              </Link>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xs)",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                }}
              >
                <span>{formatTimeAgo(comment.createdAt)}</span>
                {comment.editedAt && (
                  <>
                    <span>·</span>
                    <span style={{ fontStyle: "italic" }}>edited</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Menu */}
          {isOwner && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="btn btn-ghost"
                style={{ padding: "var(--space-xs)" }}
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <>
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 10,
                    }}
                    onClick={() => setShowMenu(false)}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      minWidth: 120,
                      zIndex: 11,
                      overflow: "hidden",
                    }}
                  >
                    {canEdit && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-sm)",
                          width: "100%",
                          padding: "var(--space-sm) var(--space-md)",
                          background: "none",
                          border: "none",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-sm)",
                        width: "100%",
                        padding: "var(--space-sm) var(--space-md)",
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div style={{ marginBottom: "var(--space-sm)" }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="input"
              rows={3}
              maxLength={1000}
              style={{ width: "100%", resize: "none", marginBottom: "var(--space-sm)" }}
            />
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button className="btn btn-primary btn-sm" onClick={handleEdit}>
                Save
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                Cancel
              </button>
            </div>
            {canEdit && (
              <div
                className="text-muted"
                style={{
                  fontSize: "0.75rem",
                  marginTop: "var(--space-xs)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xs)",
                }}
              >
                <Clock size={12} />
                Edit window closes in{" "}
                {Math.ceil((15 * 60 * 1000 - (Date.now() - comment.createdAt)) / 60000)} min
              </div>
            )}
          </div>
        ) : (
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.5,
              marginBottom: "var(--space-sm)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {comment.content}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <button
            onClick={handleToggleLike}
            disabled={!sessionToken || isLiking}
            className="btn btn-ghost"
            style={{
              padding: "var(--space-xs) var(--space-sm)",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              color: hasLiked ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <Heart size={14} fill={hasLiked ? "currentColor" : "none"} />
            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
          </button>

          {!isReply && sessionToken && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="btn btn-ghost"
              style={{
                padding: "var(--space-xs) var(--space-sm)",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-xs)",
                color: "var(--text-muted)",
              }}
            >
              <MessageSquare size={14} />
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && sessionToken && (
        <div style={{ marginLeft: "var(--space-xl)", marginBottom: "var(--space-md)" }}>
          <CommentForm
            creationId={creationId}
            sessionToken={sessionToken}
            parentId={comment._id}
            placeholder="Write a reply..."
            autoFocus
            onCancel={() => setShowReplyForm(false)}
            onSuccess={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div style={{ marginTop: "var(--space-sm)" }}>
          {replies.map((reply) => (
            <Comment
              key={reply._id}
              comment={reply}
              creationId={creationId}
              sessionToken={sessionToken}
              currentUserId={currentUserId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
