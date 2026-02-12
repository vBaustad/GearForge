import type { Metadata, Viewport } from "next";
import { Cinzel } from "next/font/google";
import { ConvexClientProvider } from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { ConditionalAnalytics } from "@/components/ConditionalAnalytics";
import { ChecklistProvider } from "@/lib/checklistContext";
import { ChecklistPanel, ChecklistToggle } from "@/components/ChecklistPanel";
import "./globals.css";

// Load Cinzel for display text
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gearforge.io"),
  title: {
    default: "GearForge - WoW Housing Designs | Midnight & TWW Player Housing Gallery",
    template: "%s | GearForge",
  },
  description:
    "Browse and share World of Warcraft housing designs for Midnight and The War Within. Find cozy bedroom layouts, tavern builds, and garden ideas. Copy import strings instantly. Free community gallery of WoW player housing creations.",
  keywords: [
    "WoW housing",
    "World of Warcraft housing",
    "WoW player housing",
    "WoW Midnight housing",
    "Midnight expansion housing",
    "TWW housing",
    "The War Within housing",
    "WoW housing designs",
    "WoW import string",
    "housing import export",
    "WoW cozy bedroom",
    "WoW tavern build",
    "WoW garden layout",
    "blood elf housing",
    "night elf housing",
    "WoW housing ideas",
    "WoW decor items",
    "cozy WoW home",
  ],
  authors: [{ name: "GearForge" }],
  creator: "GearForge",
  publisher: "GearForge",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "GearForge",
    title: "GearForge - WoW Housing Designs Gallery",
    description:
      "Browse and share World of Warcraft housing designs. Find inspiration with community-created layouts and import strings for Midnight and The War Within player housing.",
    images: [
      {
        url: "/og-cover.png",
        width: 1200,
        height: 630,
        alt: "GearForge - WoW Housing Creations gallery preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GearForge - WoW Housing Creations",
    description:
      "Discover and share World of Warcraft player housing creations. Browse designs and copy import strings.",
    images: ["/og-cover.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12100e",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cinzel.variable}>
      <head>
        {/* Wowhead tooltips */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var whTooltips = {
                colorLinks: true,
                iconizeLinks: false,
                renameLinks: false,
                hide: { sellprice: true }
              };
            `,
          }}
        />
        <script defer src="https://wow.zamimg.com/js/tooltips.js" />

        {/* Preconnects for external resources */}
        <link rel="preconnect" href="https://wow.zamimg.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//wow.zamimg.com" />
        <link rel="preconnect" href="https://render.worldofwarcraft.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//render.worldofwarcraft.com" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "GearForge",
              alternateName: [
                "GearForge WoW Housing",
                "WoW Housing Creations",
                "WoW Housing Gallery",
                "The War Within Housing Designs",
                "Midnight Housing Designs",
              ],
              url: "https://gearforge.io/",
              description:
                "Browse and share World of Warcraft housing designs for Midnight and The War Within.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://gearforge.io/browse?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "GearForge",
              url: "https://gearforge.io/",
              logo: "https://gearforge.io/android-chrome-512x512.png",
              description: "Community platform for World of Warcraft player housing designs",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "GearForge",
              applicationCategory: "GameApplication",
              applicationSubCategory: "World of Warcraft Companion Tool",
              operatingSystem: "Web Browser",
              description:
                "Free tool for browsing and sharing World of Warcraft housing designs with import strings",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Browse WoW housing designs for Midnight and TWW",
                "Copy import strings with one click",
                "Upload your own housing creations",
                "Search by category: bedroom, tavern, garden, library, kitchen",
                "View 2000+ housing decor items database",
                "Share builds with the community",
                "Blood Elf and Night Elf themed designs",
                "Cozy aesthetic home inspiration",
              ],
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ConvexClientProvider>
          <ChecklistProvider>
            {/* Skip to main content link for accessibility */}
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <div className="app-wrapper">
              <Header />
              <main id="main-content" className="main-content" role="main">
                {children}
              </main>
              <Footer />
            </div>
            {/* Checklist panel and toggle */}
            <ChecklistPanel />
            <ChecklistToggle />
            {/* Cookie consent banner */}
            <CookieConsent />
          </ChecklistProvider>
        </ConvexClientProvider>
        {/* Vercel Analytics - only loads if user consents */}
        <ConditionalAnalytics />
      </body>
    </html>
  );
}
