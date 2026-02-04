import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://gearforge.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/callback"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
