import type { Metadata } from "next";
import { DecorPageClient } from "./DecorPageClient";

export const metadata: Metadata = {
  title: "Housing Items",
  description:
    "Complete database of World of Warcraft housing items for Midnight and TWW. Browse 2000+ decor items, furniture, and fixtures. Find where to farm housing items with Wowhead links.",
  keywords: [
    "WoW housing items",
    "WoW decor database",
    "WoW furniture list",
    "WoW Midnight decorations",
    "housing item farming",
    "blood elf decor",
    "night elf decor",
    "WoW decor farming",
    "TWW housing items",
  ],
};

export default function DecorPage() {
  return <DecorPageClient />;
}
