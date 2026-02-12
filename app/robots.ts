import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://gearforge.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/",
          "/api/*",
          "/auth/callback",
          "/auth/connect/*",
          "/settings",
          "/upload",
          "/*.json$",
        ],
      },
      {
        // Allow Googlebot to access all public content
        userAgent: "Googlebot",
        allow: ["/", "/browse", "/design/*", "/user/*", "/decor", "/help", "/faq", "/about"],
        disallow: ["/admin", "/api/", "/auth/", "/settings"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
