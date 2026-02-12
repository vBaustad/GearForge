"use client";

import { useState } from "react";
import { X, Copy, Check, Code } from "lucide-react";

interface EmbedModalProps {
  designId: string;
  title: string;
  onClose: () => void;
}

export function EmbedModal({ designId, title, onClose }: EmbedModalProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copied, setCopied] = useState(false);

  const embedUrl = `https://gearforge.io/embed/${designId}?theme=${theme}`;
  const iframeCode = `<iframe src="${embedUrl}" width="480" height="160" frameborder="0" style="border-radius: 12px; max-width: 100%;"></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Code size={20} />
            Embed Design
          </h2>
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Embed &ldquo;{title}&rdquo; on your website or blog.
          </p>

          {/* Theme selector */}
          <div className="embed-theme-selector">
            <label>Theme:</label>
            <div className="theme-buttons">
              <button
                className={`theme-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                Dark
              </button>
              <button
                className={`theme-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                Light
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="embed-preview">
            <span className="preview-label">Preview</span>
            <div className={`preview-container ${theme}`}>
              <iframe
                src={embedUrl}
                width="100%"
                height="160"
                frameBorder="0"
                style={{ borderRadius: 12, maxWidth: "100%" }}
              />
            </div>
          </div>

          {/* Code */}
          <div className="embed-code">
            <span className="code-label">Embed Code</span>
            <div className="code-container">
              <code>{iframeCode}</code>
              <button
                className={`btn btn-sm ${copied ? "btn-primary" : "btn-secondary"}`}
                onClick={handleCopy}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
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
            max-width: 560px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-lg);
            border-bottom: 1px solid var(--border);
          }

          .modal-header h2 {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            font-size: 1.125rem;
            margin: 0;
          }

          .modal-body {
            padding: var(--space-lg);
          }

          .modal-description {
            color: var(--text-secondary);
            margin-bottom: var(--space-lg);
          }

          .embed-theme-selector {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            margin-bottom: var(--space-lg);
          }

          .embed-theme-selector label {
            font-weight: 500;
          }

          .theme-buttons {
            display: flex;
            gap: var(--space-xs);
          }

          .theme-btn {
            padding: var(--space-xs) var(--space-md);
            border: 1px solid var(--border);
            background: var(--surface);
            border-radius: var(--radius);
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 0.875rem;
            transition: all 0.15s ease;
          }

          .theme-btn:hover {
            background: var(--surface-elevated);
          }

          .theme-btn.active {
            background: var(--accent);
            color: var(--bg-deep);
            border-color: var(--accent);
          }

          .embed-preview {
            margin-bottom: var(--space-lg);
          }

          .preview-label,
          .code-label {
            display: block;
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-muted);
            margin-bottom: var(--space-sm);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .preview-container {
            border-radius: var(--radius-md);
            overflow: hidden;
          }

          .preview-container.dark {
            background: #141210;
          }

          .preview-container.light {
            background: #f5f0e6;
          }

          .embed-code {
            margin-bottom: var(--space-md);
          }

          .code-container {
            display: flex;
            gap: var(--space-sm);
            align-items: flex-start;
          }

          .code-container code {
            flex: 1;
            padding: var(--space-sm);
            background: var(--bg-deep);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            font-size: 0.75rem;
            word-break: break-all;
            line-height: 1.5;
          }
        `}</style>
      </div>
    </div>
  );
}
