import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { UserPageClient } from "./UserPageClient";

// Generate metadata dynamically for each user profile
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
    const user = await client.query(api.users.getMetadata, {
      id: id as Id<"users">,
    });

    if (!user) {
      return {
        title: "User Not Found",
        description: "This user profile doesn't exist on GearForge.",
      };
    }

    const title = `${user.displayName}'s WoW Housing Designs`;
    const description =
      user.bio ||
      `Browse ${user.designCount} WoW housing design${user.designCount !== 1 ? "s" : ""} by ${user.displayName}. ${user.totalLikes} total likes. Find bedroom layouts, tavern builds, and more for World of Warcraft Midnight.`;

    return {
      title,
      description,
      keywords: [
        "WoW housing creator",
        "WoW housing designs",
        user.displayName,
        "WoW Midnight housing",
        "housing gallery",
      ],
      openGraph: {
        type: "profile",
        title,
        description,
        url: `/user/${id}`,
        images: user.avatarUrl
          ? [
              {
                url: user.avatarUrl,
                width: 200,
                height: 200,
                alt: `${user.displayName}'s profile`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch (error) {
    console.error("Failed to fetch user metadata:", error);
    return {
      title: "Creator Profile",
      description: "View this creator's World of Warcraft housing designs on GearForge.",
    };
  }
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log("UserPage rendering with id:", id);
  return <UserPageClient id={id} />;
}
