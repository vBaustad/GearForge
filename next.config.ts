import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.convex.cloud",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://oauth.battle.net https://*.api.blizzard.com https://api.sightengine.com https://nether.wowhead.com https://id.twitch.tv https://api.twitch.tv https://oauth2.googleapis.com https://www.googleapis.com https://id.kick.com https://api.kick.com",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Convex endpoints
  async rewrites() {
    return [];
  },

  // Image optimization for external sources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "render.worldofwarcraft.com",
      },
      {
        protocol: "https",
        hostname: "wow.zamimg.com",
      },
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
    ],
  },

  // Enable experimental features for Convex
  experimental: {
    // Required for Convex
  },

  // TypeScript strict mode
  typescript: {
    // Don't fail build on type errors during migration
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
