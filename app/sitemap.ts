import { MetadataRoute } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const BASE_URL = "https://gearforge.io";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/browse`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/browse?sort=popular`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/browse?sort=newest`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/decor`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/upload`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Category pages - all categories with both sorting options
  const categories = [
    "bedroom",
    "living_room",
    "kitchen",
    "garden",
    "tavern",
    "throne_room",
    "workshop",
    "library",
    "exterior",
    "other",
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((cat) => [
    {
      url: `${BASE_URL}/browse?category=${cat}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/browse?category=${cat}&sort=popular`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.75,
    },
  ]);

  // Fetch dynamic pages from Convex
  let designPages: MetadataRoute.Sitemap = [];
  let userPages: MetadataRoute.Sitemap = [];

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl) {
      const client = new ConvexHttpClient(convexUrl);

      // Fetch designs
      const designs = await client.query(api.creations.listForSitemap, {});
      designPages = designs.map((design: { _id: string; _creationTime: number }) => ({
        url: `${BASE_URL}/design/${design._id}`,
        lastModified: new Date(design._creationTime),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

      // Fetch creator profiles
      const users = await client.query(api.users.listForSitemap, {});
      userPages = users.map((user: { _id: string; _creationTime: number }) => ({
        url: `${BASE_URL}/user/${user._id}`,
        lastModified: new Date(user._creationTime),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch dynamic pages for sitemap:", error);
    // Continue with static pages if Convex fetch fails
  }

  return [...staticPages, ...categoryPages, ...designPages, ...userPages];
}
