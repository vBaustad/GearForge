"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Settings, Check } from "lucide-react";

const CONSENT_KEY = "gearforge_cookie_consent";

interface CookiePreferences {
  necessary: boolean; // Always true, can't be disabled
  analytics: boolean;
  functional: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  functional: false,
};

export function CookieConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | "pending">("pending");
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check localStorage for existing consent
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        setHasConsent(true);
      } catch {
        setHasConsent(false);
        setTimeout(() => setIsVisible(true), 1000);
      }
    } else {
      setHasConsent(false);
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setHasConsent(true);
    setIsVisible(false);
    setShowPreferences(false);

    // Dispatch custom event so analytics component can react
    window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: prefs }));
  };

  const handleAcceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      functional: true,
    });
  };

  const handleDeclineAll = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      functional: false,
    });
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  // Don't render if consent already given or still checking
  if (hasConsent === "pending" || hasConsent === true) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Main Banner */}
      {!showPreferences && (
        <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
          <div className="cookie-content">
            <div className="cookie-text">
              <p>
                We use cookies to enhance your experience, analyze site traffic, and personalize content.
              </p>
              <Link href="/privacy" className="cookie-link">
                Privacy Policy
              </Link>
            </div>
            <div className="cookie-actions">
              <button
                className="btn-cookie btn-manage"
                onClick={() => setShowPreferences(true)}
              >
                <Settings size={16} />
                Manage
              </button>
              <button className="btn-cookie btn-decline" onClick={handleDeclineAll}>
                Decline All
              </button>
              <button className="btn-cookie btn-accept" onClick={handleAcceptAll}>
                <Check size={16} />
                Accept All
              </button>
            </div>
          </div>
          <button
            className="cookie-close"
            onClick={handleDeclineAll}
            aria-label="Close and decline cookies"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="cookie-modal-backdrop" onClick={() => setShowPreferences(false)}>
          <div
            className="cookie-modal"
            role="dialog"
            aria-label="Cookie preferences"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Cookie Preferences</h2>
              <button
                className="modal-close"
                onClick={() => setShowPreferences(false)}
                aria-label="Close preferences"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Manage your cookie preferences below. You can enable or disable different types of cookies.
                Note that disabling some cookies may affect your experience on the site.
              </p>

              {/* Necessary Cookies */}
              <div className="cookie-category">
                <div className="category-header">
                  <div className="category-info">
                    <h3>Necessary Cookies</h3>
                    <p>Required for the website to function. Cannot be disabled.</p>
                  </div>
                  <div className="toggle-wrapper">
                    <input
                      type="checkbox"
                      id="necessary"
                      checked={true}
                      disabled
                      className="toggle-input"
                    />
                    <label htmlFor="necessary" className="toggle-label disabled">
                      <span className="toggle-switch" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="cookie-category">
                <div className="category-header">
                  <div className="category-info">
                    <h3>Analytics Cookies</h3>
                    <p>Help us understand how visitors interact with our website (Vercel Analytics).</p>
                  </div>
                  <div className="toggle-wrapper">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="toggle-input"
                    />
                    <label htmlFor="analytics" className="toggle-label">
                      <span className="toggle-switch" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="cookie-category">
                <div className="category-header">
                  <div className="category-info">
                    <h3>Functional Cookies</h3>
                    <p>Enable enhanced functionality like remembering your preferences.</p>
                  </div>
                  <div className="toggle-wrapper">
                    <input
                      type="checkbox"
                      id="functional"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                      className="toggle-input"
                    />
                    <label htmlFor="functional" className="toggle-label">
                      <span className="toggle-switch" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cookie btn-decline" onClick={handleDeclineAll}>
                Decline All
              </button>
              <button className="btn-cookie btn-accept" onClick={handleSavePreferences}>
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cookie-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-elevated);
          border-top: 1px solid var(--border);
          padding: var(--space-lg);
          z-index: 1000;
          animation: slideUp 0.3s ease-out;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .cookie-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-xl);
          flex-wrap: wrap;
        }

        .cookie-text {
          flex: 1;
          min-width: 280px;
        }

        .cookie-text p {
          margin: 0 0 var(--space-xs);
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .cookie-link {
          color: var(--accent);
          font-size: 0.8125rem;
          text-decoration: underline;
        }

        .cookie-link:hover {
          text-decoration: none;
        }

        .cookie-actions {
          display: flex;
          gap: var(--space-sm);
          flex-shrink: 0;
          flex-wrap: wrap;
        }

        .btn-cookie {
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
          padding: 10px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: var(--radius);
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .btn-manage {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .btn-manage:hover {
          background: var(--surface);
          color: var(--text-primary);
        }

        .btn-decline {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .btn-decline:hover {
          background: var(--surface);
          color: var(--text-primary);
        }

        .btn-accept {
          background: var(--accent);
          color: white;
        }

        .btn-accept:hover {
          filter: brightness(1.1);
        }

        .cookie-close {
          position: absolute;
          top: var(--space-sm);
          right: var(--space-sm);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: var(--space-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          transition: color 0.15s ease, background 0.15s ease;
        }

        .cookie-close:hover {
          color: var(--text-primary);
          background: var(--surface);
        }

        /* Preferences Modal */
        .cookie-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          padding: var(--space-lg);
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .cookie-modal {
          background: var(--bg-elevated);
          border-radius: var(--radius-lg);
          max-width: 520px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: scaleIn 0.2s ease-out;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--border);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: var(--space-xs);
          border-radius: var(--radius);
          display: flex;
        }

        .modal-close:hover {
          color: var(--text-primary);
          background: var(--surface);
        }

        .modal-body {
          padding: var(--space-lg);
        }

        .modal-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0 0 var(--space-xl);
          line-height: 1.6;
        }

        .cookie-category {
          padding: var(--space-md) 0;
          border-bottom: 1px solid var(--border);
        }

        .cookie-category:last-child {
          border-bottom: none;
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-md);
        }

        .category-info {
          flex: 1;
        }

        .category-info h3 {
          margin: 0 0 var(--space-xs);
          font-size: 0.9375rem;
          font-weight: 600;
        }

        .category-info p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* Toggle Switch */
        .toggle-wrapper {
          flex-shrink: 0;
        }

        .toggle-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-label {
          display: block;
          width: 48px;
          height: 26px;
          cursor: pointer;
        }

        .toggle-label.disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .toggle-switch {
          display: block;
          width: 100%;
          height: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 13px;
          position: relative;
          transition: background 0.2s ease;
        }

        .toggle-switch::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .toggle-input:checked + .toggle-label .toggle-switch {
          background: var(--accent);
          border-color: var(--accent);
        }

        .toggle-input:checked + .toggle-label .toggle-switch::after {
          transform: translateX(22px);
        }

        .toggle-input:disabled + .toggle-label .toggle-switch {
          background: var(--accent);
          border-color: var(--accent);
        }

        .toggle-input:disabled + .toggle-label .toggle-switch::after {
          transform: translateX(22px);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-sm);
          padding: var(--space-lg);
          border-top: 1px solid var(--border);
        }

        @media (max-width: 600px) {
          .cookie-banner {
            padding: var(--space-lg);
            padding-top: var(--space-xl);
          }

          .cookie-content {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-lg);
          }

          .cookie-text {
            text-align: center;
          }

          .cookie-actions {
            justify-content: center;
          }

          .modal-footer {
            flex-direction: column;
          }

          .modal-footer .btn-cookie {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}

// Export function to get current cookie preferences (for use in analytics)
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Export function to check if analytics is allowed
export function isAnalyticsAllowed(): boolean {
  const prefs = getCookiePreferences();
  return prefs?.analytics ?? false;
}
