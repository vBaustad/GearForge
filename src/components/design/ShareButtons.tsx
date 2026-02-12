"use client";

import { useState } from "react";
import { Share2, Link, Check, Twitter, MessageCircle, Code } from "lucide-react";
import { trackShare } from "@/lib/analytics";
import { EmbedModal } from "./EmbedModal";

interface ShareButtonsProps {
  designId: string;
  title: string;
  creatorName: string;
}

export function ShareButtons({ designId, title, creatorName }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/design/${designId}`
    : `https://gearforge.io/design/${designId}`;

  const shareText = `Check out "${title}" by ${creatorName.split("#")[0]} on GearForge!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare("copy_link", designId);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
    trackShare("twitter", designId);
    setShowMenu(false);
  };

  const handleShareReddit = () => {
    const url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
    trackShare("reddit", designId);
    setShowMenu(false);
  };

  const handleShareDiscord = () => {
    // Copy a Discord-friendly format
    const discordText = `**${title}** by ${creatorName.split("#")[0]}\n${shareUrl}`;
    navigator.clipboard.writeText(discordText);
    setCopied(true);
    trackShare("discord", designId);
    setTimeout(() => {
      setCopied(false);
      setShowMenu(false);
    }, 2000);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="btn btn-secondary"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-xs)",
        }}
      >
        <Share2 size={16} />
        Share
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "var(--space-xs)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              minWidth: 180,
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm) var(--space-md)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {copied ? <Check size={16} style={{ color: "var(--success)" }} /> : <Link size={16} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>

            {/* Twitter/X */}
            <button
              onClick={handleShareTwitter}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm) var(--space-md)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <Twitter size={16} />
              Share on X
            </button>

            {/* Reddit */}
            <button
              onClick={handleShareReddit}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm) var(--space-md)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
              Share on Reddit
            </button>

            {/* Discord */}
            <button
              onClick={handleShareDiscord}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm) var(--space-md)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <MessageCircle size={16} />
              Copy for Discord
            </button>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--border)", margin: "var(--space-xs) 0" }} />

            {/* Embed */}
            <button
              onClick={() => {
                setShowMenu(false);
                setShowEmbedModal(true);
                trackShare("embed", designId);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm) var(--space-md)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <Code size={16} />
              Embed
            </button>
          </div>
        </>
      )}

      {/* Embed Modal */}
      {showEmbedModal && (
        <EmbedModal
          designId={designId}
          title={title}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
    </div>
  );
}
