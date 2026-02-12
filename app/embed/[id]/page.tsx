import type { Metadata, Viewport } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { EmbedWidget } from "./EmbedWidget";

const CATEGORY_LABELS: Record<string, string> = {
  bedroom: "Bedroom",
  living_room: "Living Room",
  kitchen: "Kitchen",
  garden: "Garden",
  tavern: "Tavern",
  throne_room: "Throne Room",
  workshop: "Workshop",
  library: "Library",
  exterior: "Exterior",
  other: "Other",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (!id || id === "undefined" || id === "null") {
    return { title: "Design Embed" };
  }

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return { title: "Design Embed" };
    }

    const client = new ConvexHttpClient(convexUrl);
    const design = await client.query(api.creations.getMetadata, {
      id: id as Id<"creations">,
    });

    if (!design) {
      return { title: "Design Embed" };
    }

    const categoryLabel = CATEGORY_LABELS[design.category] || design.category;

    return {
      title: `${design.title} - ${categoryLabel} | GearForge`,
      description: `${categoryLabel} housing design by ${design.creatorName}`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Design Embed" };
  }
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ theme?: string }>;
}) {
  const { id } = await params;
  const { theme = "dark" } = await searchParams;

  return <EmbedWidget id={id} theme={theme} />;
}
