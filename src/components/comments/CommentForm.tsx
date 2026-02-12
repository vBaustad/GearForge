"use client";

import { useState } from "react";
import { Send, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/errorMessages";

interface CommentFormProps {
  creationId: Id<"creations">;
  sessionToken: string;
  parentId?: Id<"comments">;
  onCancel?: () => void;
  onSuccess?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  creationId,
  sessionToken,
  parentId,
  onCancel,
  onSuccess,
  placeholder = "Add a comment...",
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createComment = useMutation(api.comments.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createComment({
        sessionToken,
        creationId,
        content: content.trim(),
        parentId,
      });

      setContent("");
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          style={{
            padding: "var(--space-sm)",
            marginBottom: "var(--space-sm)",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius)",
            color: "#ef4444",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="input"
          rows={parentId ? 2 : 3}
          maxLength={1000}
          autoFocus={autoFocus}
          style={{
            flex: 1,
            resize: "none",
            minHeight: parentId ? "60px" : "80px",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!content.trim() || isSubmitting}
            style={{
              padding: "var(--space-sm)",
              minWidth: "44px",
            }}
            title="Post comment"
          >
            <Send size={18} />
          </button>
          {onCancel && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              style={{
                padding: "var(--space-sm)",
                minWidth: "44px",
              }}
              title="Cancel"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div
        className="text-muted"
        style={{
          fontSize: "0.75rem",
          marginTop: "var(--space-xs)",
          textAlign: "right",
        }}
      >
        {content.length}/1000
      </div>
    </form>
  );
}
