import type { Metadata } from "next";
import { SettingsPageClient } from "./SettingsPageClient";

export const metadata: Metadata = {
  title: "Settings",
  description: "Update your profile settings, bio, and social links.",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
