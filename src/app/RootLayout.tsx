// src/app/RootLayout.tsx
import { Outlet, useMatches, useLocation } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { InfoBar } from "../components/InfoBar";
import GoogleAd from "../components/ads/GoogleAd"; // use default import (optional)
import { AD_SLOTS } from "../config/ads";
import type { UIMatch } from "react-router-dom";
import { AdGate } from "../components/ads/AdGate";

export function RootLayout() {
  type RouteHandle = { noAds?: boolean };
  const matches = useMatches() as UIMatch<RouteHandle>[];
  const { pathname } = useLocation();

  const noAdsFromHandle = matches.some(m => (m.handle as RouteHandle)?.noAds);
  const noAdsByPath =
    pathname.startsWith("/guides/classes") ||
    pathname === "/faq" ||
    pathname === "/terms" ||
    pathname === "/privacy";
  const noAds = noAdsFromHandle || noAdsByPath;

  const isOptimizerInput = pathname === "/optimizer";
  const noAdsStrict = noAds || isOptimizerInput;

  // 🔑 Compute env + flag LOCALLY (don’t import ADS_ENABLED)
  const client = import.meta.env.VITE_ADSENSE_CLIENT ?? "";
  const adsEnabled = client.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Inject/remove script only when allowed */}
      <AdGate client={client} enabled={adsEnabled && !noAdsStrict} />

      <Header />
      <InfoBar />

      <div className="px-6 mt-6">
        <div className="max-w-5xl mx-auto">
          {!noAdsStrict && <GoogleAd slot={AD_SLOTS.layoutTop} placeholderLabel="Top banner" />}
        </div>
      </div>

      <main className="flex-1 shrink-0">
        <div className="max-w-7xl mx-auto w-full px-6">
          <Outlet />
        </div>
      </main>

      <div className="px-6 mb-6">
        <div className="max-w-5xl mx-auto">
          {!noAdsStrict && <GoogleAd slot={AD_SLOTS.layoutFooter} placeholderLabel="Footer banner" />}
        </div>
      </div>

      <Footer />
    </div>
  );
}
