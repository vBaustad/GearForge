// src/app/RootLayout.tsx
import { Outlet, useMatches, useLocation, type UIMatch } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { InfoBar } from "../components/InfoBar";
import GoogleAd from "../components/ads/GoogleAd";
import { AD_SLOTS } from "../config/ads";

type RouteHandle = { noAds?: boolean; allowLayoutAds?: boolean };

// Type-safe extractor so TS doesn't see handle as {}
function getHandle(m: UIMatch<unknown>): RouteHandle {
  return (m.handle ?? {}) as RouteHandle;
}

export function RootLayout() {
  // Cast the matches array to a generic UIMatch to keep strong typing
  const matches = useMatches() as UIMatch<unknown>[];
  const { pathname } = useLocation();

  const noAds = matches.some(m => Boolean(getHandle(m).noAds));
  const allowLayoutAds = matches.some(m => Boolean(getHandle(m).allowLayoutAds));

  return (
    <div className="min-h-screen flex flex-col">
      {/* AdSense loader stays in index.html */}
      <Header />
      <InfoBar />

      <main className="flex-1 shrink-0">
        <div className="max-w-7xl mx-auto w-full px-6">
          <Outlet />
        </div>
      </main>

      {!noAds && allowLayoutAds && (
        <div className="px-6 mb-6">
          <div className="max-w-5xl mx-auto">
            <GoogleAd
              key={`layout-footer-${pathname}`}
              slot={AD_SLOTS.layoutFooter}
              placeholderLabel="Footer banner"
              enabled
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default RootLayout;
