import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowsePageClient } from "./BrowsePageClient";

export const metadata: Metadata = {
  title: "Browse Designs",
  description:
    "Browse hundreds of World of Warcraft housing designs. Find cozy bedroom layouts, tavern builds, aesthetic gardens, and more. Copy import strings instantly for Midnight and TWW player housing.",
  keywords: [
    "WoW housing designs",
    "WoW Midnight housing",
    "cozy WoW home",
    "WoW housing gallery",
    "housing import strings",
    "WoW bedroom design",
    "WoW tavern build",
    "WoW garden layout",
    "aesthetic WoW builds",
    "blood elf housing",
    "night elf housing",
  ],
};

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowsePageLoading />}>
      <BrowsePageClient />
    </Suspense>
  );
}

function BrowsePageLoading() {
  return (
    <div className="container page-section">
      <div className="section-header">
        <h1>Browse Designs</h1>
      </div>
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <div className="skeleton" style={{ width: "200px", height: "20px" }} />
      </div>
    </div>
  );
}
