import type { Metadata } from "next";
import { ChangelogPageClient } from "./ChangelogPageClient";

export const metadata: Metadata = {
  title: "Changelog - GearForge Updates",
  description:
    "See what's new in GearForge. Stay up to date with the latest features, improvements, and bug fixes.",
  keywords: ["GearForge changelog", "GearForge updates", "new features", "release notes"],
};

export default function ChangelogPage() {
  return <ChangelogPageClient />;
}
