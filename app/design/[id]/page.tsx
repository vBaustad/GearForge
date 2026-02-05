import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { DesignPageClient } from "./DesignPageClient";

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

// Generate metadata dynamically for each design
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("Convex URL not configured");
    }

    const client = new ConvexHttpClient(convexUrl);
    const design = await client.query(api.creations.getMetadata, {
      id: id as Id<"creations">,
    });

    if (!design) {
      return {
        title: "Design Not Found",
        description: "This WoW housing design may have been removed or doesn't exist.",
      };
    }

    const categoryLabel = CATEGORY_LABELS[design.category] || design.category;
    const title = `${design.title} - ${categoryLabel} Design by ${design.creatorName}`;
    const description =
      design.description ||
      `View this ${categoryLabel.toLowerCase()} housing design for World of Warcraft Midnight. Created by ${design.creatorName}. ${design.likeCount} likes. Copy the import string to recreate this layout in your WoW home.`;

    return {
      title,
      description,
      keywords: [
        `WoW ${categoryLabel.toLowerCase()} design`,
        "WoW housing",
        "WoW Midnight housing",
        "housing import string",
        design.creatorName,
        ...design.tags.slice(0, 5),
      ],
      openGraph: {
        type: "article",
        title,
        description,
        url: `/design/${id}`,
        images: design.thumbnailUrl
          ? [
              {
                url: design.thumbnailUrl,
                width: 800,
                height: 600,
                alt: `${design.title} - WoW Housing Design`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: design.thumbnailUrl ? [design.thumbnailUrl] : undefined,
      },
    };
  } catch (error) {
    console.error("Failed to fetch design metadata:", error);
    return {
      title: "Housing Design",
      description:
        "View this World of Warcraft housing design. Copy the import string to recreate this layout in your own home.",
    };
  }
}

export default async function DesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DesignPageClient id={id} />;
}
