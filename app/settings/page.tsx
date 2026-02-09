import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageClient } from "./SettingsPageClient";
import { Loader } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings",
  description: "Update your profile settings, bio, and social links.",
  robots: { index: false, follow: false },
};

function SettingsLoading() {
  return (
    <div className="container page-section">
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Loader size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPageClient />
    </Suspense>
  );
}
