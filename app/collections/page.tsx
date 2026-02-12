import type { Metadata } from "next";
import { CollectionsPageClient } from "./CollectionsPageClient";

export const metadata: Metadata = {
  title: "Collections - Curated WoW Housing Designs",
  description:
    "Browse curated collections of World of Warcraft housing designs. Find themed sets of furniture and decor ideas for your WoW home.",
  keywords: [
    "WoW housing collections",
    "WoW furniture sets",
    "housing design collections",
    "curated WoW designs",
  ],
};

export default function CollectionsPage() {
  return <CollectionsPageClient />;
}
