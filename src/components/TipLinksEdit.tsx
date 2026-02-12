"use client";

import { useState, useEffect } from "react";
import { Coffee, Heart, DollarSign, Users, ExternalLink, Save, AlertCircle, CheckCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { parseConvexError } from "@/lib/errorMessages";

interface TipLinksEditProps {
  sessionToken: string;
  currentTipLinks?: {
    buymeacoffee?: string;
    kofi?: string;
    paypal?: string;
    patreon?: string;
  };
  onSuccess?: () => void;
}

const platforms = [
  {
    key: "buymeacoffee" as const,
    label: "Buy Me a Coffee",
    placeholder: "buymeacoffee.com/username",
    color: "#FFDD00",
    icon: Coffee,
    hint: "Enter your Buy Me a Coffee URL",
  },
  {
    key: "kofi" as const,
    label: "Ko-fi",
    placeholder: "ko-fi.com/username",
    color: "#FF5E5B",
    icon: Heart,
    hint: "Enter your Ko-fi URL",
  },
  {
    key: "paypal" as const,
    label: "PayPal.me",
    placeholder: "paypal.me/username",
    color: "#003087",
    icon: DollarSign,
    hint: "Enter your PayPal.me URL",
  },
  {
    key: "patreon" as const,
    label: "Patreon",
    placeholder: "patreon.com/username",
    color: "#FF424D",
    icon: Users,
    hint: "Enter your Patreon URL",
  },
];

export function TipLinksEdit({ sessionToken, currentTipLinks, onSuccess }: TipLinksEditProps) {
  const [tipLinks, setTipLinks] = useState({
    buymeacoffee: "",
    kofi: "",
    paypal: "",
    patreon: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [success, setSuccess] = useState(false);

  const updateProfile = useMutation(api.users.updateProfile);

  // Initialize from current values
  useEffect(() => {
    if (currentTipLinks) {
      setTipLinks({
        buymeacoffee: currentTipLinks.buymeacoffee || "",
        kofi: currentTipLinks.kofi || "",
        paypal: currentTipLinks.paypal || "",
        patreon: currentTipLinks.patreon || "",
      });
    }
  }, [currentTipLinks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      await updateProfile({
        sessionToken,
        tipLinks: {
          buymeacoffee: tipLinks.buymeacoffee || undefined,
          kofi: tipLinks.kofi || undefined,
          paypal: tipLinks.paypal || undefined,
          patreon: tipLinks.patreon || undefined,
        },
      });

      setSuccess(true);
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const parsed = parseConvexError(err);
      setError(parsed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card" style={{ padding: "var(--space-lg)" }}>
      <h2
        style={{
          marginBottom: "var(--space-md)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
        }}
      >
        <DollarSign size={20} />
        Tip Links
      </h2>
      <p
        className="text-secondary"
        style={{ marginBottom: "var(--space-lg)", fontSize: "0.9375rem" }}
      >
        Add links to your tip jars or support pages. These will be displayed on your public profile.
      </p>

      {error && (
        <div
          style={{
            padding: "var(--space-sm)",
            marginBottom: "var(--space-md)",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            color: "#ef4444",
            fontSize: "0.875rem",
          }}
        >
          <AlertCircle size={16} />
          {error.message}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "var(--space-sm)",
            marginBottom: "var(--space-md)",
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "var(--radius)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            color: "#22c55e",
            fontSize: "0.875rem",
          }}
        >
          <CheckCircle size={16} />
          Tip links saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const hasError = error?.field === platform.key || error?.field === "tipLinks";
            return (
              <div key={platform.key}>
                <label
                  htmlFor={platform.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-xs)",
                    marginBottom: "var(--space-xs)",
                    fontWeight: 500,
                    color: hasError ? "#ef4444" : undefined,
                  }}
                >
                  <Icon size={16} style={{ color: hasError ? "#ef4444" : platform.color }} />
                  {platform.label}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    id={platform.key}
                    value={tipLinks[platform.key]}
                    onChange={(e) => {
                      setTipLinks((prev) => ({ ...prev, [platform.key]: e.target.value }));
                      // Clear error when user starts typing
                      if (error) setError(null);
                    }}
                    placeholder={platform.placeholder}
                    className="input"
                    style={{
                      width: "100%",
                      paddingRight: tipLinks[platform.key] ? "40px" : undefined,
                      borderColor: hasError ? "#ef4444" : undefined,
                    }}
                  />
                  {tipLinks[platform.key] && (
                    <a
                      href={tipLinks[platform.key].startsWith("http") ? tipLinks[platform.key] : `https://${tipLinks[platform.key]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                      title="Preview link"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
                <p
                  className="text-muted"
                  style={{ fontSize: "0.75rem", marginTop: "var(--space-xs)" }}
                >
                  {platform.hint}
                </p>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving}
          style={{
            marginTop: "var(--space-lg)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
          }}
        >
          <Save size={18} />
          {isSaving ? "Saving..." : "Save Tip Links"}
        </button>
      </form>
    </div>
  );
}
