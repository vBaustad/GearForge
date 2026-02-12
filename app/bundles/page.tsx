import type { Metadata } from "next";
import { BundlesPageClient } from "./BundlesPageClient";

export const metadata: Metadata = {
  title: "Room Bundles - GearForge",
  description:
    "Discover complete room designs bundled together. Find coordinated WoW housing layouts for bedrooms, living rooms, and more.",
  keywords: [
    "WoW room bundles",
    "WoW housing layouts",
    "complete room designs",
    "coordinated housing",
    "room design sets",
  ],
};

export default function BundlesPage() {
  return <BundlesPageClient />;
}
