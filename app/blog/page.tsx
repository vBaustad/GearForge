import type { Metadata } from "next";
import { BlogPageClient } from "./BlogPageClient";

export const metadata: Metadata = {
  title: "Blog - GearForge",
  description:
    "Tips, guides, and news about World of Warcraft housing. Learn how to create amazing WoW homes with our tutorials and inspiration.",
  keywords: [
    "WoW housing blog",
    "WoW housing tips",
    "WoW housing guides",
    "WoW decor tutorials",
    "housing design tips",
  ],
  openGraph: {
    title: "GearForge Blog - WoW Housing Tips & Guides",
    description: "Tips, guides, and news about World of Warcraft housing.",
  },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
