"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const CONSENT_KEY = "gearforge_cookie_consent";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
}

/**
 * Conditionally loads Vercel Analytics and Speed Insights
 * based on user's cookie consent preferences.
 */
export function ConditionalAnalytics() {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    // Check initial consent
    const checkConsent = () => {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        try {
          const prefs: CookiePreferences = JSON.parse(stored);
          setAnalyticsAllowed(prefs.analytics === true);
        } catch {
          setAnalyticsAllowed(false);
        }
      } else {
        setAnalyticsAllowed(false);
      }
    };

    checkConsent();

    // Listen for storage changes (in case user updates preferences in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY) {
        checkConsent();
      }
    };

    // Listen for custom event when preferences are saved
    const handleConsentChange = () => {
      checkConsent();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cookieConsentChanged", handleConsentChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cookieConsentChanged", handleConsentChange);
    };
  }, []);

  // Only render analytics if user has explicitly consented
  if (!analyticsAllowed) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
